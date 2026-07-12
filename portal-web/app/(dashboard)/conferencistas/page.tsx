import type { Metadata } from "next";
import { ConferencistaCard } from "@/components/conferencistas/conferencista-card";
import { getConferencias } from "@/repositories/conferencistasRepository";

export const metadata: Metadata = { title: "Conferencistas — Diagnóstico: Tu Voz Fundamental" };

export default function ConferencistasPage() {
  const conferencias = getConferencias();

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-heading text-xl font-bold text-foreground lg:text-2xl">Conferencistas</h1>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Jornadas, conferencistas y conversatorios del Plan Estratégico 2027–2037 — {conferencias.length} en total.
        </p>
      </div>

      {conferencias.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {conferencias.map((c) => (
            <ConferencistaCard key={c.id} conferencia={c} />
          ))}
        </div>
      ) : (
        <p className="rounded-lg border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
          Aún no hay conferencistas publicados.
        </p>
      )}
    </div>
  );
}
