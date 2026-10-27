import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentPharmacy } from "@/lib/auth";
import { RegisterForm } from "@/components/RegisterForm";

export const metadata: Metadata = { title: "Registrazione farmacia" };

export default async function RegistratiPage() {
  const pharmacy = await getCurrentPharmacy();
  if (pharmacy) redirect("/area-farmacie/dashboard");

  return (
    <div className="container-app py-12">
      <h1 className="text-center text-2xl font-bold">Registra la tua farmacia</h1>
      <p className="mx-auto mt-2 max-w-xl text-center text-sm text-slate-600">
        I dati sono usati solo per mostrare i recapiti della farmacia sulle schede dei
        farmaci di cui segnali disponibilità.
      </p>
      <RegisterForm />
      <p className="mt-5 text-center text-sm text-slate-600">
        Hai già un account?{" "}
        <Link href="/area-farmacie/accedi" className="font-semibold text-brand-700 hover:underline">
          Accedi
        </Link>
      </p>
    </div>
  );
}
