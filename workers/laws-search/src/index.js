const MODEL = "@cf/baai/bge-m3";
const MAX_QUERY = 300;
const MAX_TEXTS = 25;
const MAX_TEXT = 2000;

function allowedOrigin(origin) {
  if (origin === "https://bridge.zdenektomis.eu") return true;
  try {
    const { hostname } = new URL(origin);
    return hostname === "localhost" || hostname === "127.0.0.1";
  } catch {
    return false;
  }
}

function respond(body, status, origin, extra = {}) {
  const headers = { "Content-Type": "application/json", Vary: "Origin", ...extra };
  if (allowedOrigin(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS";
    headers["Access-Control-Allow-Headers"] = "Content-Type";
  }
  return new Response(body === null ? null : JSON.stringify(body), { status, headers });
}

function round(vectors) {
  return vectors.map((v) => v.map((x) => Math.round(x * 10000) / 10000));
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const url = new URL(request.url);
    if (request.method === "OPTIONS") return respond(null, 204, origin);
    if (url.pathname !== "/embed") return respond({ error: "not found" }, 404, origin);

    let texts;
    if (request.method === "GET") {
      const q = (url.searchParams.get("q") || "").trim();
      if (!q || q.length > MAX_QUERY) return respond({ error: "q must be 1-300 characters" }, 400, origin);
      texts = [q];
    } else if (request.method === "POST") {
      const body = await request.json().catch(() => null);
      texts = body && body.texts;
      const ok =
        Array.isArray(texts) &&
        texts.length > 0 &&
        texts.length <= MAX_TEXTS &&
        texts.every((t) => typeof t === "string" && t.length > 0 && t.length <= MAX_TEXT);
      if (!ok) return respond({ error: "texts must be 1-25 strings of 1-2000 characters" }, 400, origin);
    } else {
      return respond({ error: "method not allowed" }, 405, origin);
    }

    try {
      const out = await env.AI.run(MODEL, { text: texts });
      const cache = request.method === "GET" ? { "Cache-Control": "public, max-age=86400" } : {};
      return respond({ data: round(out.data) }, 200, origin, cache);
    } catch (e) {
      return respond({ error: "embedding failed" }, 502, origin);
    }
  },
};
