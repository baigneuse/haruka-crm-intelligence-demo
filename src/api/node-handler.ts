import type { IncomingMessage, ServerResponse } from "node:http";
import { createApiHandler, MAX_BODY_BYTES } from "./app.js";
import { syntheticDataset } from "../data/synthetic.js";
import { InMemoryCrmRepository } from "../repositories/in-memory-crm-repository.js";

const api = createApiHandler(new InMemoryCrmRepository(syntheticDataset), syntheticDataset.asOfDate);

/** Deployment adapter: no driver, credentials, request logging, or writable repository. */
export default async function handleApi(request: IncomingMessage, response: ServerResponse): Promise<void> {
  response.setHeader("cache-control", "no-store");
  response.setHeader("content-type", "application/json; charset=utf-8");
  response.setHeader("x-content-type-options", "nosniff");
  try {
    if ((process.env.DATA_MODE ?? "synthetic") !== "synthetic") throw new Error("Unsupported mode");
    const chunks: Buffer[] = [];
    let size = 0;
    for await (const chunk of request) {
      const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      size += buffer.length;
      if (size > MAX_BODY_BYTES) {
        response.statusCode = 413;
        response.end(JSON.stringify({ error: { code: "payload_too_large", message: "Request exceeds 8 KiB." } }));
        return;
      }
      chunks.push(buffer);
    }
    const headers = new Headers();
    for (const [key, value] of Object.entries(request.headers)) {
      if (Array.isArray(value)) value.forEach((part) => headers.append(key, part));
      else if (value !== undefined) headers.set(key, value);
    }
    const method = request.method ?? "GET";
    const body = Buffer.concat(chunks);
    const webRequest = new Request(new URL(request.url ?? "/", "http://demo.test"), {
      method, headers, ...(method === "GET" || method === "HEAD" ? {} : { body }),
    });
    const result = await api(webRequest);
    response.statusCode = result.status;
    result.headers.forEach((value, key) => response.setHeader(key, value));
    response.end(Buffer.from(await result.arrayBuffer()));
  } catch {
    response.statusCode = 500;
    response.end(JSON.stringify({ error: { code: "internal_error", message: "The request could not be completed." } }));
  }
}
