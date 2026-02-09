// app/api/admin/registration-requests/[id]/reject/route.ts
import { NextRequest } from "next/server";
import { proxyToApi } from "@/lib/proxy";

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  return proxyToApi(req, `/admin/registration-requests/${id}/reject`);
}
