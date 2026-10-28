import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentPharmacy } from "@/lib/auth";
import { LoginForm } from "@/components/LoginForm";

export const metadata: Metadata = {
  title: "Accedi",
  robots: { index: false, follow: false },
};

export default async function AccediPage() {
  const pharmacy = await getCurrentPharmacy();
  if (pharmacy) redirect("/area-farmacie/dashboard");

  return (
    <div className="container-app py-12">
      <h1 className="text-center text-2xl font-bold">Accedi all'area farmacie</h1>
      <LoginForm />
      <p className="mt-5 text-center text-sm text-slate-600">
        Non hai un account?{" "}
        <Link href="/area-farmacie/registrati" className="font-semibold text-brand-700 hover:underline">
          Registra la farmacia
        </Link>
      </p>
    </div>
  );
}
