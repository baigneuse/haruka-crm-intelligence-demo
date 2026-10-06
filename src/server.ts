import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join } from "node:path";
import handleApi from "./api/node-handler.js";

const port = Number(process.env.PORT ?? 3000);
const dataMode = process.env.DATA_MODE ?? "synthetic";

if (dataMode !== "synthetic") {
  throw new Error("The public demo server supports DATA_MODE=synthetic only. Inject PostgresCrmRepository in a private runtime composition root.");
}

const projectRoot = process.cwd();
const publicRoot = join(projectRoot, "public");

const staticFiles: Record<string, string> = {
  "/": "index.html",
  "/index.html": "index.html",
  "/app.js": "app.js",
  "/styles.css": "styles.css",
  "/favicon.svg": "favicon.svg",
};

const mimeTypes: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
};

function applySecurityHeaders(response: ServerResponse): void {
  response.setHeader("x-content-type-options", "nosniff");
  response.setHeader("x-frame-options", "DENY");
  response.setHeader("referrer-policy", "no-referrer");
  response.setHeader(
    "content-security-policy",
    "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'",
  );
}

async function handle(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const path = request.url ? new URL(request.url, "http://localhost").pathname : "/";
  if (path.startsWith("/api/")) {
    applySecurityHeaders(response);
    await handleApi(request, response);
    return;
  }

  const file = staticFiles[path];
  if (!file) {
    response.statusCode = 404;
    applySecurityHeaders(response);
    response.end("Not found");
    return;
  }

  const contents = await readFile(join(publicRoot, file));
  response.statusCode = 200;
  response.setHeader("content-type", mimeTypes[extname(file)] ?? "application/octet-stream");
  applySecurityHeaders(response);
  response.end(contents);
}

const server = createServer((request, response) => {
  void handle(request, response).catch(() => {
    response.statusCode = 500;
    applySecurityHeaders(response);
    response.end("Internal server error");
  });
});

server.listen(port, "127.0.0.1", () => {
  console.log(`HARUKA public demo running at http://127.0.0.1:${port}`);
});
