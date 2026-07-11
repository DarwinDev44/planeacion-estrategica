import type { Metadata } from "next";
import { TablaMetaCard } from "@/components/metas/tabla-meta";
import { getTablasMetas } from "@/repositories/metasRepository";

export const metadata: Metadata = { title: "Metas" };

export default function MetasPage() {
  const tablas = getTablasMetas();
  const [gca, administrativosContrato, administrativosSede, estudiantes, graduados] = tablas;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-xl font-bold text-foreground lg:text-2xl">Metas</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Cumplimiento de metas por categoría — NO / SI sobre el total de cada grupo.
          </p>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          <LeyendaColor color="var(--success)" etiqueta="≥ 80%" />
          <LeyendaColor color="var(--warning)" etiqueta="50–79%" />
          <LeyendaColor color="var(--destructive)" etiqueta="< 50%" />
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <TablaMetaCard tabla={gca} />
        <TablaMetaCard tabla={administrativosContrato} />
        <TablaMetaCard tabla={administrativosSede} />
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <TablaMetaCard tabla={estudiantes} />
        <TablaMetaCard tabla={graduados} />
      </div>
    </div>
  );
}

function LeyendaColor({ color, etiqueta }: { color: string; etiqueta: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="size-2 rounded-full" style={{ backgroundColor: color }} aria-hidden />
      {etiqueta}
    </span>
  );
}
