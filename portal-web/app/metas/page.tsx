import type { Metadata } from "next";
import { TablaMetaCard } from "@/components/metas/tabla-meta";
import { getTablasMetas } from "@/repositories/metasRepository";

export const metadata: Metadata = { title: "Metas — Diagnóstico: Tu Voz Fundamental" };

export default function MetasPage() {
  const tablas = getTablasMetas();
  const [gca, administrativosContrato, administrativosSede, estudiantes, graduados] = tablas;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <div>
          <h1 className="font-heading text-xl font-bold text-foreground lg:text-2xl">
            Metas — Diagnóstico: Tu Voz Fundamental
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Cumplimiento de metas por categoría — Sí: completó el diagnóstico; No: no registra participación
            en el diagnóstico.
          </p>
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
