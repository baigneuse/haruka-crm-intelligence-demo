import test from "node:test";
import assert from "node:assert/strict";
import { createApiHandler } from "../src/api/app.js";
import { parseAgentRequest } from "../src/domain/validation.js";
import { syntheticDataset } from "../src/data/synthetic.js";
import { InMemoryCrmRepository } from "../src/repositories/in-memory-crm-repository.js";
import { CalculateLtvTool } from "../src/agent/tools/calculate-ltv.js";

const api = createApiHandler(new InMemoryCrmRepository(syntheticDataset), syntheticDataset.asOfDate);
const request = (body: string, contentType = "application/json") => new Request("http://demo.test/api/agent/run", {
  method: "POST", headers: { "content-type": contentType }, body,
});

test("public API rejects excessive bodies, invalid JSON and non-JSON media", async () => {
  assert.equal((await api(request("x".repeat(8193)))).status, 413);
  assert.equal((await api(request("{}", "text/plain"))).status, 415);
  assert.equal((await api(request("{"))).status, 400);
  assert.equal((await api(new Request("http://demo.test/api/agent/run", {
    method: "POST", headers: { "content-type": "application/json" }, body: new Uint8Array([0xff]),
  }))).status, 400);
});

test("validation rejects impossible dates and unbounded identifiers", () => {
  for (const asOfDate of ["2026-02-31", "2026-13-01", "not-a-date"]) {
    assert.throws(() => parseAgentRequest({ question: "profile", asOfDate }));
  }
  assert.throws(() => parseAgentRequest({ question: "profile", customerId: "a".repeat(81) }));
  assert.throws(() => parseAgentRequest({ question: "profile", customerId: "<script>" }));
  assert.equal(parseAgentRequest({ question: "profile", asOfDate: "2024-02-29" }).asOfDate, "2024-02-29");
});

test("no write, import, reset or admin endpoints; responses are not cached", async () => {
  for (const path of ["/api/customers", "/api/orders", "/api/import", "/api/reset", "/api/admin"]) {
    assert.equal((await api(new Request(`http://demo.test${path}`, { method: "DELETE" }))).status, 404);
    assert.equal((await api(new Request(`http://demo.test${path}`, { method: "POST" }))).status, 404);
  }
  assert.equal((await api(new Request("http://demo.test/api/health"))).headers.get("cache-control"), "no-store");
});

test("revenue evidence references exactly the eligible order items", async () => {
  const tool = new CalculateLtvTool(new InMemoryCrmRepository(syntheticDataset));
  const result = await tool.execute({ customerId: "CUST-002", asOfDate: syntheticDataset.asOfDate });
  assert.deepEqual(result.evidence[0]?.sourceIds, ["ITEM-200"]);
  assert.equal(result.result.metrics.totalRevenue, 4000);
  const noOrders = await tool.execute({ customerId: "CUST-002", asOfDate: "2025-01-01" });
  assert.deepEqual(noOrders.evidence[0]?.sourceIds, []);
  assert.equal(noOrders.result.metrics.totalRevenue, 0);
});
