import type { CrmDataset } from "../domain/types.js";
import type { CrmRepository } from "./crm-repository.js";

export class InMemoryCrmRepository implements CrmRepository {
  constructor(private readonly dataset: CrmDataset) {}

  async listCustomers() {
    return structuredClone(this.dataset.customers);
  }

  async getCustomer(customerId: string) {
    const customer = this.dataset.customers.find((row) => row.id === customerId);
    return customer ? structuredClone(customer) : null;
  }

  async listProducts() {
    return structuredClone(this.dataset.products);
  }

  async listOrders() {
    return structuredClone(this.dataset.orders);
  }

  async listOrdersForCustomer(customerId: string) {
    return structuredClone(this.dataset.orders.filter((row) => row.customerId === customerId));
  }

  async listOrderItems(orderIds?: string[]) {
    if (!orderIds) return structuredClone(this.dataset.orderItems);
    const selected = new Set(orderIds);
    return structuredClone(this.dataset.orderItems.filter((row) => selected.has(row.orderId)));
  }

  async listCampaigns() {
    return structuredClone(this.dataset.campaigns);
  }
}
