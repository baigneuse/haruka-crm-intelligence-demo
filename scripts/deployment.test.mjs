import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { resolve, join } from "node:path";
import { pathToFileURL } from "node:url";
import { createServer } from "node:http";
import { once } from "node:events";

const root = resolve(".vercel/output");
function files(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => entry.isDirectory()
    ? files(join(directory, entry.name)) : [join(directory, entry.name)]);
}

test("deployment artifact contains only allowlisted runtime assets", () => {
  const paths = files(root);
  for (const path of paths) {
    assert.doesNotMatch(path, /(?:node_modules|postgres-crm|\.env|\.map$|\.log$|\.sql$|\.test\.|schema_migrations)/i);
    assert.doesNotMatch(readFileSync(path, "utf8"), /process\.env\.(?:DATABASE_URL|SUPABASE|OPENAI)/);
  }
  assert.deepEqual(readdirSync(join(root, "static")).sort(), ["app.js", "favicon.svg", "index.html", "styles.css"]);
  const config = JSON.parse(readFileSync(join(root, "config.json"), "utf8"));
  assert.equal(config.version, 3);
  assert.equal(config.routes.at(-1).status, 404);
  assert.match(config.routes[0].headers["Content-Security-Policy"], /frame-ancestors 'none'/);
});

test("built function executes the CUST-002 scenario without a database", async () => {
  const { default: handler } = await import(pathToFileURL(join(root, "functions/api.func/api/node-handler.js")).href);
  const server = createServer(handler);
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    const health = await (await fetch(`${base}/api/health`)).json();
    assert.equal(health.dataMode, "synthetic");
    const response = await fetch(`${base}/api/agent/run`, {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ question: "Recommend a campaign", customerId: "CUST-002" }),
    });
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.structuredResult.actionCode, "personalized_win_back");
    assert.equal(body.evidence.find((item) => item.id === "metric:CUST-002:ltv").value, 4800);
    assert.equal(body.toolTrace.length, 4);
    assert.equal((await fetch(`${base}/api/reset`, { method: "POST" })).status, 404);
    assert.equal((await fetch(`${base}/api/agent/run`, {
      method: "POST", headers: { "content-type": "application/json" }, body: "x".repeat(8193),
    })).status, 413);
  } finally {
    server.closeAllConnections();
    await new Promise((resolveClose, reject) => server.close((error) => error ? reject(error) : resolveClose()));
  }
});
