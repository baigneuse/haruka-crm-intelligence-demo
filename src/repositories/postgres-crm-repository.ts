import type { Campaign, Channel, Customer, CustomerSegment, Order, OrderItem, PriceSensitivity, Product, ProductRole } from "../domain/types.js";
import type { CrmRepository } from "./crm-repository.js";

export interface SqlResult<T> {
  rows: T[];
}

export interface SqlClient {
  query<T>(text: string, parameters?: readonly unknown[]): Promise<SqlResult<T>>;
}

type CustomerRow = { id: string; display_name: string; joined_at: string; segment: CustomerSegment; beauty_concern: string; price_sensitivity: PriceSensitivity };
type ProductRow = { id: string; name: string; category: string; role: ProductRole; list_price: number | string };
type OrderRow = { id: string; customer_id: string; ordered_at: string; channel: Channel; discount_rate: number | string; coupon_used: boolean; campaign_id: string | null };
type OrderItemRow = { id: string; order_id: string; product_id: string; quantity: number; unit_price: number | string };
type CampaignRow = { id: string; name: string; target_segment: CustomerSegment; action: string; status: Campaign["status"]; start_date: string; end_date: string; budget: number | string };

const mapCustomer = (row: CustomerRow): Customer => ({ id: row.id, displayName: row.display_name, joinedAt: row.joined_at, segment: row.segment, beautyConcern: row.beauty_concern, priceSensitivity: row.price_sensitivity });
const mapProduct = (row: ProductRow): Product => ({ id: row.id, name: row.name, category: row.category, role: row.role, listPrice: Number(row.list_price) });
const mapOrder = (row: OrderRow): Order => ({ id: row.id, customerId: row.customer_id, orderedAt: row.ordered_at, channel: row.channel, discountRate: Number(row.discount_rate), couponUsed: row.coupon_used, ...(row.campaign_id ? { campaignId: row.campaign_id } : {}) });
const mapOrderItem = (row: OrderItemRow): OrderItem => ({ id: row.id, orderId: row.order_id, productId: row.product_id, quantity: row.quantity, unitPrice: Number(row.unit_price) });
const mapCampaign = (row: CampaignRow): Campaign => ({ id: row.id, name: row.name, targetSegment: row.target_segment, action: row.action, status: row.status, startDate: row.start_date, endDate: row.end_date, budget: Number(row.budget) });

export class PostgresCrmRepository implements CrmRepository {
  constructor(private readonly sql: SqlClient) {}

  async listCustomers() {
    const result = await this.sql.query<CustomerRow>("SELECT id, display_name, joined_at::text, segment, beauty_concern, price_sensitivity FROM customers ORDER BY id");
    return result.rows.map(mapCustomer);
  }

  async getCustomer(customerId: string) {
    const result = await this.sql.query<CustomerRow>("SELECT id, display_name, joined_at::text, segment, beauty_concern, price_sensitivity FROM customers WHERE id = $1", [customerId]);
    return result.rows[0] ? mapCustomer(result.rows[0]) : null;
  }

  async listProducts() {
    const result = await this.sql.query<ProductRow>("SELECT id, name, category, role, list_price FROM products ORDER BY id");
    return result.rows.map(mapProduct);
  }

  async listOrders() {
    const result = await this.sql.query<OrderRow>("SELECT id, customer_id, ordered_at::text, channel, discount_rate, coupon_used, campaign_id FROM orders ORDER BY ordered_at, id");
    return result.rows.map(mapOrder);
  }

  async listOrdersForCustomer(customerId: string) {
    const result = await this.sql.query<OrderRow>("SELECT id, customer_id, ordered_at::text, channel, discount_rate, coupon_used, campaign_id FROM orders WHERE customer_id = $1 ORDER BY ordered_at, id", [customerId]);
    return result.rows.map(mapOrder);
  }

  async listOrderItems(orderIds?: string[]) {
    const result = orderIds
      ? await this.sql.query<OrderItemRow>("SELECT id, order_id, product_id, quantity, unit_price FROM order_items WHERE order_id = ANY($1::text[]) ORDER BY id", [orderIds])
      : await this.sql.query<OrderItemRow>("SELECT id, order_id, product_id, quantity, unit_price FROM order_items ORDER BY id");
    return result.rows.map(mapOrderItem);
  }

  async listCampaigns() {
    const result = await this.sql.query<CampaignRow>("SELECT id, name, target_segment, action, status, start_date::text, end_date::text, budget FROM campaigns ORDER BY start_date, id");
    return result.rows.map(mapCampaign);
  }
}
