import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.API_URL;

if (!API_URL) {
  throw new Error("Missing API_URL in .env.local");
}

const apiUrl = API_URL;

type HeadersWithSetCookie = Headers & {
  getSetCookie?: () => string[];
};

function joinUrl(base: string, path: string) {
  const b = base.replace(/\/+$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${b}${p}`;
}

function appendSetCookieHeaders(dst: NextResponse, src: Response) {
  const headers = src.headers as HeadersWithSetCookie;
  const setCookies =
    typeof headers.getSetCookie === "function"
      ? headers.getSetCookie()
      : undefined;

  if (setCookies?.length) {
    for (const c of setCookies) dst.headers.append("set-cookie", c);
    return;
  }

  const single = src.headers.get("set-cookie");
  if (single) dst.headers.append("set-cookie", single);
}

export async function proxyToApi(req: NextRequest, apiPathWithQuery: string) {
  const url = joinUrl(apiUrl, apiPathWithQuery);

  const headers = new Headers(req.headers);
  headers.delete("host");

  const cookie = req.headers.get("cookie");
  if (cookie) headers.set("cookie", cookie);

  const upstream = await fetch(url, {
    method: req.method,
    headers,
    body:
      req.method === "GET" || req.method === "HEAD"
        ? undefined
        : await req.text(),
  });

  const contentType = upstream.headers.get("content-type") || "";

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
