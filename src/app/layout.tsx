import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: {
    default: "FarmacoMancante — farmaci carenti e disponibilità sul territorio",
    template: "%s · FarmacoMancante",
  },
  description:
    "La lista aggiornata dei farmaci temporaneamente carenti in Italia e le farmacie che ne segnalano disponibilità: per medici prescrittori, cittadini e farmacisti.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="it">
      <body className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
