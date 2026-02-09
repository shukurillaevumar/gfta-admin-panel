// app/api/admin/users/route.ts
import { NextRequest } from "next/server";
import { proxyToApi } from "@/lib/proxy";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams.toString();
  const qs = sp ? `?${sp}` : "";
  return proxyToApi(req, `/admin/users${qs}`);
}
