import { notFound } from "next/navigation";
import { ensureData, getDrugByAic } from "@/lib/db";

/**
 * La scheda farmaco è dentro un segmento con loading.tsx: quando la pagina
 * chiama notFound() il flusso è già in streaming e lo stato HTTP resta 200
 * (soft-404), dannoso per SEO e per i link condivisi.
 *
 * Il layout viene eseguito *prima* che parta lo streaming del segmento, quindi
 * qui possiamo validare l'AIC e restituire un 404 vero. La pagina mantiene il
 * proprio controllo come rete di sicurezza.
 */
export default async function DrugLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ aic: string }>;
}) {
  await ensureData();
  const { aic } = await params;
  if (!getDrugByAic(aic)) notFound();
  return children;
}
