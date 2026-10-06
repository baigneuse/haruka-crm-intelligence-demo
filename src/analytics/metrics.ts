import type { CustomerMetrics, Order, OrderItem } from "../domain/types.js";
import type { CrmRepository } from "../repositories/crm-repository.js";

const DAY_MS = 86_400_000;

export function daysBetween(earlier: string, later: string): number {
  const start = Date.parse(`${earlier}T00:00:00Z`);
  const end = Date.parse(`${later}T00:00:00Z`);
  return Math.max(0, Math.floor((end - start) / DAY_MS));
}

export function orderRevenue(order: Order, items: readonly OrderItem[]): number {
  const gross = items
    .filter((item) => item.orderId === order.id)
    .reduce((total, item) => total + item.quantity * item.unitPrice, 0);
  return Math.round(gross * (1 - order.discountRate / 100));
}

export function estimateLtv(totalRevenue: number, orderCount: number): number {
  if (orderCount === 0) return 0;
  const multiplier = orderCount >= 4 ? 2.8 : orderCount >= 2 ? 2 : 1.2;
  return Math.round(totalRevenue * multiplier);
}

export function classifyChurnRisk(daysSinceLastPurchase: number | null): CustomerMetrics["churnRisk"] {
  if (daysSinceLastPurchase === null || daysSinceLastPurchase >= 120) return "high";
  if (daysSinceLastPurchase >= 60) return "medium";
  return "low";
}

export function calculateMetrics(
  customerId: string,
  orders: readonly Order[],
  orderItems: readonly OrderItem[],
  asOfDate: string,
): CustomerMetrics {
  const customerOrders = orders
    .filter((order) => order.customerId === customerId && order.orderedAt <= asOfDate)
    .sort((a, b) => a.orderedAt.localeCompare(b.orderedAt));
  const totalRevenue = customerOrders.reduce((total, order) => total + orderRevenue(order, orderItems), 0);
  const lastPurchaseDate = customerOrders.at(-1)?.orderedAt ?? null;
  const daysSinceLastPurchase = lastPurchaseDate ? daysBetween(lastPurchaseDate, asOfDate) : null;
  const orderCount = customerOrders.length;

  return {
    customerId,
    orderCount,
    totalRevenue,
    averageOrderValue: orderCount === 0 ? 0 : Math.round(totalRevenue / orderCount),
    lastPurchaseDate,
    daysSinceLastPurchase,
    couponRate: orderCount === 0 ? 0 : customerOrders.filter((order) => order.couponUsed).length / orderCount,
    estimatedLtv: estimateLtv(totalRevenue, orderCount),
    churnRisk: classifyChurnRisk(daysSinceLastPurchase),
  };
}

export async function calculateCustomerMetrics(
  repository: CrmRepository,
  customerId: string,
  asOfDate: string,
): Promise<CustomerMetrics> {
  const orders = await repository.listOrdersForCustomer(customerId);
  const orderItems = await repository.listOrderItems(orders.map((order) => order.id));
  return calculateMetrics(customerId, orders, orderItems, asOfDate);
}
