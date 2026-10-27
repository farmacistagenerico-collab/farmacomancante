import { findMdmMatch, listAllPharmacies } from "@/lib/db";
import { formatDateIT } from "@/lib/format";
import { VerifyPharmacyButton } from "@/components/admin/AdminButtons";

export const metadata = { title: "Farmacie · Admin" };

export default function AdminPharmaciesPage() {
  const pharmacies = listAllPharmacies();

  return (
    <div>
      <h2 className="text-lg font-semibold">
        Farmacie iscritte{" "}
        <span className="text-sm font-normal text-slate-500">({pharmacies.length})</span>
      </h2>
      <p className="mt-1 text-sm text-slate-500">
        La verifica può essere manuale o assistita dal confronto con l'anagrafe del Ministero
        della Salute (importabile da <code>npm run import:farmacie-mdm</code>).
      </p>

      {pharmacies.length === 0 ? (
        <div className="card mt-5 p-8 text-center text-sm text-slate-500">
          Nessuna farmacia iscritta al momento.
        </div>
      ) : (
        <div className="table-wrap mt-5">
          <table className="table">
            <thead>
              <tr>
                <th>Farmacia</th>
                <th>Sede</th>
                <th>Codice / P.IVA</th>
                <th>Confronto anagrafe MDM</th>
                <th>Attività</th>
                <th>Stato</th>
                <th aria-label="Azioni" />
              </tr>
            </thead>
            <tbody>
              {pharmacies.map((p) => {
                const match = findMdmMatch(p);
                return (
                  <tr key={p.id}>
                    <td>
                      <p className="font-semibold text-slate-900">{p.name}</p>
                      <p className="text-xs text-slate-500">{p.email}</p>
                    </td>
                    <td className="text-slate-600">
                      {[p.city, p.province].filter(Boolean).join(", ") || "—"}
                      {p.address ? <span className="block text-xs">{p.address}</span> : null}
                    </td>
                    <td className="text-slate-600">{p.licenseCode ?? "—"}</td>
                    <td>
                      {match ? (
                        <span
                          className={`badge ${
                            match.confidence === "esatta" ? "badge-green" : "badge-amber"
                          }`}
                          title={match.detail}
                        >
                          {match.confidence === "esatta" ? "Corrispondenza esatta" : "Corrispondenza probabile"}
                        </span>
                      ) : (
                        <span className="badge-gray">nessun confronto</span>
                      )}
                    </td>
                    <td className="text-xs text-slate-600">
                      {p.availabilityCount} disponibilità
                      <br />
                      {p.reportCount} segnalazioni
                      <br />
                      <span className="text-slate-400">dal {formatDateIT(p.createdAt.slice(0, 10))}</span>
                    </td>
                    <td>
                      {p.verified === 1 ? (
                        <span className="badge-green">
                          <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5" aria-hidden="true">
                            <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                          </svg>
                          Verificata
                        </span>
                      ) : (
                        <span className="badge-gray">Non verificata</span>
                      )}
                    </td>
                    <td>
                      <VerifyPharmacyButton pharmacyId={p.id} verified={p.verified === 1} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
