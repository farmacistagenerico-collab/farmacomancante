import { listSources } from "@/lib/db";
import { formatDateTimeIT } from "@/lib/format";
import { ImportAifaButton } from "@/components/admin/AdminButtons";

export const metadata = { title: "Fonti · Admin" };

export default function AdminSourcesPage() {
  const sources = listSources();

  return (
    <div className="space-y-8">
      <section className="card p-6">
        <h2 className="text-lg font-semibold">Lista AIFA</h2>
        <p className="mt-2 text-sm text-slate-600">
          Avvia subito l'aggiornamento dalla fonte ufficiale. Se la rete non è raggiungibile,
          il sistema ricade automaticamente sull'ultimo CSV archiviato in{" "}
          <code>data/raw/</code>.
        </p>
        <div className="mt-4">
          <ImportAifaButton />
        </div>
        <p className="mt-3 text-xs text-slate-500">
          In produzione lo stesso lavoro può essere schedulato quotidianamente tramite
          l'endpoint cron <code>/api/cron/importa-aifa</code> (vedi <code>vercel.json</code>).
        </p>
      </section>

      <section className="card p-6">
        <h2 className="text-lg font-semibold">Registro delle fonti</h2>
        <div className="table-wrap mt-4">
          <table className="table">
            <thead>
              <tr>
                <th>Fonte</th>
                <th>Tipo</th>
                <th>Ultima sincronizzazione</th>
                <th>Esito</th>
              </tr>
            </thead>
            <tbody>
              {sources.map((s) => (
                <tr key={s.code}>
                  <td>
                    <p className="font-semibold text-slate-800">{s.name}</p>
                    {s.description && (
                      <p className="mt-0.5 max-w-md text-xs text-slate-500">{s.description}</p>
                    )}
                  </td>
                  <td>
                    <span className="badge-gray">{s.kind}</span>
                  </td>
                  <td className="whitespace-nowrap text-sm">
                    {s.lastSyncAt ? formatDateTimeIT(s.lastSyncAt) : "mai"}
                  </td>
                  <td className="text-sm">{s.lastStatus ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
