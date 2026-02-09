// app/api/auth/refresh/route.ts
import { NextRequest } from "next/server";
import { proxyToApi } from "@/lib/proxy";

export async function POST(req: NextRequest) {
  return proxyToApi(req, "/auth/refresh");
}
