import test from "node:test";
import assert from "node:assert/strict";
import { PostgresCrmRepository, type SqlClient, type SqlResult } from "../src/repositories/postgres-crm-repository.js";

class RecordingSqlClient implements SqlClient {
  calls: Array<{ text: string; parameters?: readonly unknown[] }> = [];

  async query<T>(text: string, parameters?: readonly unknown[]): Promise<SqlResult<T>> {
    this.calls.push({ text, ...(parameters ? { parameters } : {}) });
    if (text.includes("FROM customers WHERE")) {
      return { rows: [{ id: "CUST-001", display_name: "Synthetic Customer 001", joined_at: "2025-11-10", segment: "loyal", beauty_concern: "hydration", price_sensitivity: "low" }] as T[] };
    }
    return { rows: [] };
  }
}

test("Postgres adapter parameterizes customer lookup and maps snake_case rows", async () => {
  const sql = new RecordingSqlClient();
  const repository = new PostgresCrmRepository(sql);
  const customer = await repository.getCustomer("CUST-001");
  assert.equal(customer?.displayName, "Synthetic Customer 001");
  assert.match(sql.calls[0]?.text ?? "", /WHERE id = \$1/);
  assert.deepEqual(sql.calls[0]?.parameters, ["CUST-001"]);
  assert.ok(!sql.calls[0]?.text.includes("CUST-001"));
});
