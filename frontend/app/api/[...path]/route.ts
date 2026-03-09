import { NextRequest } from "next/server";

const BACKEND_BASE =
  process.env.AMLINE_API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:18000";

function targetUrl(req: NextRequest, path: string[]) {
  const joined = path.map(encodeURIComponent).join("/");
  return `${BACKEND_BASE}/${joined}${req.nextUrl.search}`;
}

async function handler(req: NextRequest, ctx: { params: { path: string[] } }) {
  const url = targetUrl(req, ctx.params.path);

  // Forward headers (Authorization is needed for JWT).
  const headers = new Headers();
  req.headers.forEach((v, k) => {
    const key = k.toLowerCase();
    if (key === "host") return;
    if (key === "content-length") return;
    headers.set(k, v);
  });

  const init: RequestInit = {
    method: req.method,
    headers,
    cache: "no-store"
  };

  if (req.method !== "GET" && req.method !== "HEAD") {
    init.body = await req.arrayBuffer();
  }

  const upstream = await fetch(url, init);

  // Pass through status and content-type.
  const outHeaders = new Headers();
  const ct = upstream.headers.get("content-type");
  if (ct) outHeaders.set("content-type", ct);

  return new Response(upstream.body, {
    status: upstream.status,
    headers: outHeaders
  });
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
