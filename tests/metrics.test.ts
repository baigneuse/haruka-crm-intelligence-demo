import test from "node:test";
import assert from "node:assert/strict";
import { calculateMetrics, classifyChurnRisk, estimateLtv, orderRevenue } from "../src/analytics/metrics.js";
import { syntheticDataset } from "../src/data/synthetic.js";

test("orderRevenue applies the recorded discount to item revenue", () => {
  const order = syntheticDataset.orders.find((row) => row.id === "ORD-102");
  assert.ok(order);
  assert.equal(orderRevenue(order, syntheticDataset.orderItems), 6300);
});

test("customer metrics are derived from orders and order items", () => {
  const metrics = calculateMetrics("CUST-001", syntheticDataset.orders, syntheticDataset.orderItems, syntheticDataset.asOfDate);
  assert.deepEqual(
    {
      orderCount: metrics.orderCount,
      totalRevenue: metrics.totalRevenue,
      averageOrderValue: metrics.averageOrderValue,
      estimatedLtv: metrics.estimatedLtv,
      churnRisk: metrics.churnRisk,
    },
    { orderCount: 3, totalRevenue: 16300, averageOrderValue: 5433, estimatedLtv: 32600, churnRisk: "low" },
  );
});

test("LTV and churn rules expose stable edge behavior", () => {
  assert.equal(estimateLtv(0, 0), 0);
  assert.equal(estimateLtv(10_000, 1), 12_000);
  assert.equal(estimateLtv(10_000, 2), 20_000);
  assert.equal(estimateLtv(10_000, 4), 28_000);
  assert.equal(classifyChurnRisk(null), "high");
  assert.equal(classifyChurnRisk(59), "low");
  assert.equal(classifyChurnRisk(60), "medium");
  assert.equal(classifyChurnRisk(120), "high");
});
