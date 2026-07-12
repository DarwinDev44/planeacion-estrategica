import type { Metadata } from "next";
import { ConferencistasGrid } from "@/components/conferencistas/conferencistas-grid";
import { getConferencias } from "@/repositories/conferencistasRepository";
import { getValoracion } from "@/repositories/valoracionesRepository";
import type { ConferenciaConValoracion } from "@/types/conferencistas";

export const metadata: Metadata = { title: "Conferencistas — Diagnóstico: Tu Voz Fundamental" };

export default function ConferencistasPage() {
  const conferencias: ConferenciaConValoracion[] = getConferencias().map((c) => ({
    ...c,
    valoracion: getValoracion(c.slug),
  }));

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-heading text-xl font-bold text-foreground lg:text-2xl">Conferencistas</h1>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Jornadas, conferencistas y conversatorios del Plan Estratégico 2027–2037 — {conferencias.length} en total.
        </p>
      </div>

      {conferencias.length > 0 ? (
        <ConferencistasGrid conferencias={conferencias} />
      ) : (
        <p className="rounded-lg border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
          Aún no hay conferencistas publicados.
        </p>
      )}
    </div>
  );
}
