import { NextRequest } from "next/server";

type HeadersWithSetCookie = Headers & {
  getSetCookie?: () => string[];
};

function appendSetCookieHeaders(dst: Response, src: Response) {
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

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const API_URL = process.env.API_URL;

  if (!API_URL) throw new Error("Missing API_URL in .env.local");

  const upstreamUrl = `${API_URL.replace(/\/+$/, "")}/admin/users/${id}`;

  const headers = new Headers(req.headers);
  headers.delete("host");

  const cookie = req.headers.get("cookie");
  if (cookie) headers.set("cookie", cookie);

  const upstream = await fetch(upstreamUrl, {
    method: "PATCH",
    headers,
    body: await req.text(),
  });

  const contentType = upstream.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const data = await upstream.json().catch(() => ({}));
    const resp = new Response(JSON.stringify(data), {
      status: upstream.status,
      headers: { "content-type": "application/json" },
    });
    appendSetCookieHeaders(resp, upstream);
    return resp;
  }

  const text = await upstream.text();
  const resp = new Response(text, { status: upstream.status });
  appendSetCookieHeaders(resp, upstream);
  resp.headers.set("content-type", contentType || "text/plain; charset=utf-8");
  return resp;
}
