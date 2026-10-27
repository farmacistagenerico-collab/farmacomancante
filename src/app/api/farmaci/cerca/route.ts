import { NextRequest } from "next/server";
import { ensureData, searchDrugs } from "@/lib/db";

export async function GET(request: NextRequest) {
  await ensureData();
  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) {
    return Response.json({ items: [] });
  }
  const { items } = searchDrugs({ q, pageSize: 8 });
  return Response.json({
    items: items.map((d) => ({
      aic: d.aic,
      name: d.name,
      activeIngredient: d.activeIngredient,
      formDosage: d.formDosage,
    })),
  });
}
