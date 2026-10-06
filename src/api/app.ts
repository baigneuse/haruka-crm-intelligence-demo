import { AgentOrchestrator } from "../agent/orchestrator.js";
import { CustomerNotFoundError } from "../agent/tool.js";
import { InputValidationError, parseAgentRequest } from "../domain/validation.js";
import type { CrmRepository } from "../repositories/crm-repository.js";

const JSON_HEADERS = { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" };
export const MAX_BODY_BYTES = 8192;

class BodyTooLargeError extends Error {}

async function readJson(request: Request): Promise<unknown> {
  const reader = request.body?.getReader();
  if (!reader) throw new InputValidationError("Request body must contain valid JSON.");
  let size = 0;
  const chunks: Uint8Array[] = [];
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BODY_BYTES) {
        await reader.cancel();
        throw new BodyTooLargeError();
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  } catch (error) {
    if (error instanceof BodyTooLargeError) throw error;
    throw new InputValidationError("Request body must contain valid UTF-8 JSON.");
  } finally {
    reader.releaseLock();
  }
}

function json(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), { status, headers: JSON_HEADERS });
}

export function createApiHandler(repository: CrmRepository, asOfDate: string) {
  const orchestrator = new AgentOrchestrator(repository, asOfDate);

  return async function handleApiRequest(request: Request): Promise<Response> {
    const url = new URL(request.url);

    try {
      if (request.method === "GET" && url.pathname === "/api/health") {
        const [customers, products, orders, campaigns] = await Promise.all([
          repository.listCustomers(),
          repository.listProducts(),
          repository.listOrders(),
          repository.listCampaigns(),
        ]);
        return json({
          status: "ok",
          dataMode: "synthetic",
          asOfDate,
          counts: {
            customers: customers.length,
            products: products.length,
            orders: orders.length,
            campaigns: campaigns.length,
          },
        });
      }

      if (request.method === "GET" && url.pathname === "/api/customers") {
        const customers = await repository.listCustomers();
        return json({ dataMode: "synthetic", asOfDate, customers });
      }

      if (request.method === "POST" && url.pathname === "/api/agent/run") {
        if (request.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase() !== "application/json") {
          return json({ error: { code: "unsupported_media_type", message: "Use application/json." } }, 415);
        }
        const body = await readJson(request);
        const parsed = parseAgentRequest(body);
        return json(await orchestrator.run(parsed));
      }

      return json({ error: { code: "not_found", message: "Route not found." } }, 404);
    } catch (error) {
      if (error instanceof BodyTooLargeError) {
        return json({ error: { code: "payload_too_large", message: "Request exceeds 8 KiB." } }, 413);
      }
      if (error instanceof InputValidationError) {
        return json({ error: { code: "invalid_request", message: error.message, details: error.details } }, 400);
      }
      if (error instanceof CustomerNotFoundError) {
        return json({ error: { code: "customer_not_found", message: error.message } }, 404);
      }
      return json({ error: { code: "internal_error", message: "The request could not be completed." } }, 500);
    }
  };
}
