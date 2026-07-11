import type { Metadata } from "next";
import { TablaMetaCard } from "@/components/metas/tabla-meta";
import { getTablasMetas } from "@/repositories/metasRepository";

export const metadata: Metadata = { title: "Metas" };

export default function MetasPage() {
  const tablas = getTablasMetas();
  const [gca, administrativosContrato, administrativosSede, estudiantes, graduados] = tablas;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-heading text-xl font-bold text-foreground lg:text-2xl">Metas</h1>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Cumplimiento de metas por categoría — NO / SI sobre el total de cada grupo.
        </p>
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
