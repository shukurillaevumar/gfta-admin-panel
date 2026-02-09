// app/api/auth/me/route.ts
import { NextRequest } from "next/server";
import { proxyToApi } from "@/lib/proxy";

export async function GET(req: NextRequest) {
  return proxyToApi(req, "/auth/me");
}
