import type { Campaign, Customer, Order, OrderItem, Product } from "../domain/types.js";

export interface CrmRepository {
  listCustomers(): Promise<Customer[]>;
  getCustomer(customerId: string): Promise<Customer | null>;
  listProducts(): Promise<Product[]>;
  listOrders(): Promise<Order[]>;
  listOrdersForCustomer(customerId: string): Promise<Order[]>;
  listOrderItems(orderIds?: string[]): Promise<OrderItem[]>;
  listCampaigns(): Promise<Campaign[]>;
}
