import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExplorationTable } from "@/components/charts/exploration-table";
import { getFilasExploracion } from "@/repositories/encuestaRepository";

export const metadata: Metadata = { title: "Exploración" };

export default function ExploracionPage() {
  const filas = getFilasExploracion();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground lg:text-3xl">Exploración</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tabla dinámica sobre el conjunto completo de participantes: busca, ordena y exporta los datos ya
          normalizados (persona, rol principal, sede, facultad y programa).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Participantes</CardTitle>
        </CardHeader>
        <CardContent>
          <ExplorationTable filas={filas} />
        </CardContent>
      </Card>
    </div>
  );
}
