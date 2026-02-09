import { NextRequest } from "next/server";
import { proxyToApi } from "@/lib/proxy";

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;

  // На бэке это PATCH /admin/users/:id
  // proxyToApi поддерживает любой метод, но тут мы делаем POST в Next -> PATCH в API
  // Поэтому просто отправим на /admin/users/:id через POST? Не прокатит.
  // Надо действительно вызвать PATCH на upstream.

  const apiPath = `/admin/users/${id}`;
  const url = new URL(req.url);
  url.pathname = `/__proxy_patch__${apiPath}`;
  // этот трюк не нужен, просто сделаем отдельный proxy ниже через fetch

  const API_URL = process.env.API_URL;
  if (!API_URL) throw new Error("Missing API_URL in .env.local");

  const upstreamUrl = `${API_URL.replace(/\/+$/, "")}${apiPath}`;

  const headers = new Headers(req.headers);
  headers.delete("host");

  const cookie = req.headers.get("cookie");
  if (cookie) headers.set("cookie", cookie);

  const bodyText = await req.text();

  const upstream = await fetch(upstreamUrl, {
    method: "PATCH",
    headers,
    body: bodyText,
  });

  const contentType = upstream.headers.get("content-type") || "";

  // set-cookie пробрасывать не обязательно, но пусть будет корректно
  const anyHeaders: any = upstream.headers as any;
  const setCookies: string[] | undefined =
    typeof anyHeaders.getSetCookie === "function"
      ? anyHeaders.getSetCookie()
      : undefined;

  if (contentType.includes("application/json")) {
    const data = await upstream.json().catch(() => ({}));
    const resp = new Response(JSON.stringify(data), {
      status: upstream.status,
      headers: { "content-type": "application/json" },
    });

    // set-cookie если вдруг
    if (setCookies?.length) {
      const r = new Response(resp.body, resp);
      for (const c of setCookies) r.headers.append("set-cookie", c);
      return r;
    }

    const single = upstream.headers.get("set-cookie");
    if (single) {
      const r = new Response(resp.body, resp);
      r.headers.append("set-cookie", single);
      return r;
    }

    return resp;
  }

  const text = await upstream.text();
  return new Response(text, { status: upstream.status });
}
