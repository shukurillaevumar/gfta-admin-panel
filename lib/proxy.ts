// lib/proxy.ts
import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.API_URL;

if (!API_URL) {
  throw new Error("Missing API_URL in .env.local");
}

function joinUrl(base: string, path: string) {
  const b = base.replace(/\/+$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${b}${p}`;
}

function appendSetCookieHeaders(dst: NextResponse, src: Response) {
  // undici (Node fetch) поддерживает getSetCookie()
  const anyHeaders: any = src.headers as any;
  const setCookies: string[] | undefined =
    typeof anyHeaders.getSetCookie === "function"
      ? anyHeaders.getSetCookie()
      : undefined;

  if (setCookies?.length) {
    for (const c of setCookies) dst.headers.append("set-cookie", c);
    return;
  }

  // fallback (иногда set-cookie может быть одной строкой)
  const single = src.headers.get("set-cookie");
  if (single) dst.headers.append("set-cookie", single);
}

export async function proxyToApi(req: NextRequest, apiPathWithQuery: string) {
  const url = joinUrl(API_URL, apiPathWithQuery);

  const headers = new Headers(req.headers);
  headers.delete("host");

  // важно: прокидываем куки от браузера в API
  const cookie = req.headers.get("cookie");
  if (cookie) headers.set("cookie", cookie);

  const upstream = await fetch(url, {
    method: req.method,
    headers,
    body:
      req.method === "GET" || req.method === "HEAD"
        ? undefined
        : await req.text(),
    // node-side, credentials не нужны
  });

  const contentType = upstream.headers.get("content-type") || "";

  // Если upstream вернул cookies, нужно отдать их браузеру
  if (contentType.includes("application/json")) {
    const data = await upstream.json().catch(() => ({}));
    const resp = NextResponse.json(data, { status: upstream.status });
    appendSetCookieHeaders(resp, upstream);
    return resp;
  }

  const text = await upstream.text();
  const resp = new NextResponse(text, { status: upstream.status });
  appendSetCookieHeaders(resp, upstream);
  resp.headers.set("content-type", contentType || "text/plain; charset=utf-8");
  return resp;
}
