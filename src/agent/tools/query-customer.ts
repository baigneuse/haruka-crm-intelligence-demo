import { localized, type Customer, type Order, type OrderItem, type ProductRole } from "../../domain/types.js";
import type { CrmRepository } from "../../repositories/crm-repository.js";
import { CustomerNotFoundError, type AgentTool } from "../tool.js";

export interface QueryCustomerInput {
  customerId: string;
  asOfDate: string;
}

export interface QueryCustomerOutput {
  customer: Customer;
  orders: Order[];
  orderItems: OrderItem[];
  purchasedRoles: ProductRole[];
}

export class QueryCustomerTool implements AgentTool<QueryCustomerInput, QueryCustomerOutput> {
  readonly name = "query_customer";
  readonly version = "1.0.0";
  readonly responsibility = localized(
    "Retrieve one customer and the purchase facts needed by downstream tools.",
    "顧客1名と後続ツールに必要な購買事実を取得します。",
    "检索一名客户及后续工具所需的购买事实。",
  );

  constructor(private readonly repository: CrmRepository) {}

  async execute(input: QueryCustomerInput) {
    const customer = await this.repository.getCustomer(input.customerId);
    if (!customer) throw new CustomerNotFoundError(input.customerId);

    const orders = (await this.repository.listOrdersForCustomer(input.customerId)).filter(
      (order) => order.orderedAt <= input.asOfDate,
    );
    const orderItems = await this.repository.listOrderItems(orders.map((order) => order.id));
    const products = await this.repository.listProducts();
    const productById = new Map(products.map((product) => [product.id, product]));
    const purchasedRoles = [...new Set(orderItems.flatMap((item) => {
      const role = productById.get(item.productId)?.role;
      return role ? [role] : [];
    }))];

    return {
      tool: this.name,
      version: this.version,
      result: { customer, orders, orderItems, purchasedRoles },
      evidence: [
        {
          id: `customer:${customer.id}:segment`,
          kind: "customer_attribute" as const,
          statement: localized(
            `${customer.id} is assigned to the ${customer.segment} segment with ${customer.beautyConcern} as the recorded concern.`,
            `${customer.id} は ${customer.segment} セグメントで、登録された悩みは ${customer.beautyConcern} です。`,
            `${customer.id} 属于 ${customer.segment} 客群，记录的关注点为 ${customer.beautyConcern}。`,
          ),
          sourceEntity: "customers" as const,
          sourceIds: [customer.id],
          value: customer.segment,
        },
        {
          id: `customer:${customer.id}:orders`,
          kind: "order_fact" as const,
          statement: localized(
            `${orders.length} eligible orders were found through ${input.asOfDate}.`,
            `${input.asOfDate} までの対象注文は ${orders.length} 件です。`,
            `截至 ${input.asOfDate} 共找到 ${orders.length} 笔有效订单。`,
          ),
          sourceEntity: "orders" as const,
          sourceIds: orders.map((order) => order.id),
          value: orders.length,
        },
        ...(orders.length === 0 ? [{
          id: `limitation:${customer.id}:no-orders`,
          kind: "limitation" as const,
          statement: localized(
            "No order history is available for purchase-based inference.",
            "購買に基づく推論に利用できる注文履歴がありません。",
            "没有可用于购买行为推断的订单历史。",
          ),
          sourceEntity: "orders" as const,
          sourceIds: [] as string[],
        }] : []),
      ],
      caveats: orders.length === 0
        ? [localized(
            "No purchase history is available, so purchase-based conclusions are limited.",
            "購買履歴がないため、購買に基づく判断には限界があります。",
            "没有购买历史，因此基于购买行为的结论有限。",
          )]
        : [],
    };
  }
}
