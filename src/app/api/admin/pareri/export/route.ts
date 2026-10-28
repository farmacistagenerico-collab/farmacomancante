import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySessionToken, isAdmin } from "@/lib/auth";
import { feedbackToCsv, getPharmacyById, listFeedback } from "@/lib/db";
import { jsonError } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET() {
  const store = await cookies();
  const pharmacyId = verifySessionToken(store.get(SESSION_COOKIE)?.value);
  const admin = pharmacyId ? getPharmacyById(pharmacyId) : null;
  if (!isAdmin(admin)) return jsonError(403, "Accesso riservato agli amministratori");

  const csv = feedbackToCsv(listFeedback({ includeHidden: true, limit: 1000 }));
  const stamp = new Date().toISOString().slice(0, 10);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="pareri-${stamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
