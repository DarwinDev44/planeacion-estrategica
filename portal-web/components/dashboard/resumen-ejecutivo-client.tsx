"use client";

import { Users, UserCog, Layers, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KpiCard } from "@/components/kpi/kpi-card";
import { RankedBarChart } from "@/components/charts/ranked-bar-chart";
import { SedeBarList } from "@/components/charts/sede-bar-list";
import { FilterBar } from "@/components/layout/filter-bar";
import { formatNumero, formatPorcentaje } from "@/lib/formatters";
import { ETIQUETA_ROL_CORTA } from "@/constants/marca";
import { PREGUNTAS } from "@/constants/preguntas";
import type { Rol } from "@/types/encuesta";
import { useResumenFiltrado, type ResumenFiltrado } from "@/hooks/use-resumen-filtrado";

export function ResumenEjecutivoClient({ inicial }: { inicial: ResumenFiltrado }) {
  const { data, hayFiltros, isFetching } = useResumenFiltrado();
  const resumen = hayFiltros && data ? data : inicial;
  const { kpis, distribucionRol, distribucionSede, rankingPreguntas } = resumen;

  const rolDatos = Object.entries(distribucionRol)
    .map(([rol, conteo]) => ({
      etiqueta: ETIQUETA_ROL_CORTA[rol as Rol] ?? rol,
      conteo,
      porcentaje: Math.round((conteo / (kpis.totalAsignacionesRol || 1)) * 1000) / 10,
    }))
    .sort((a, b) => b.conteo - a.conteo);

  const porcentajeMultiRol = Math.round((kpis.personasConMultiRol / (kpis.totalParticipantes || 1)) * 1000) / 10;

  return (
    <div className="flex flex-col gap-4">
      {/* Header: título + filtros */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-heading text-xl font-bold text-foreground lg:text-2xl">
            Panorama de participación, encuesta tu voz fundamental
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {hayFiltros ? "Filtrado" : "Todos los registros"}
            {isFetching ? (
              <Loader2 className="ml-1.5 inline size-3 animate-spin align-[-2px] text-primary" aria-label="Actualizando" />
            ) : null}
          </p>
        </div>
        <FilterBar />
      </div>

      {/* KPIs compactos */}
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
        <KpiCard compacto etiqueta="Participantes" valor={formatNumero(kpis.totalParticipantes)} icono={Users} />
        <KpiCard compacto etiqueta="Asignaciones de rol" valor={formatNumero(kpis.totalAsignacionesRol)} icono={UserCog} />
        <KpiCard
          compacto
          etiqueta="Con más de un rol"
          valor={`${formatNumero(kpis.personasConMultiRol)} (${formatPorcentaje(porcentajeMultiRol)})`}
          icono={Layers}
        />
      </div>

      {/* Fila superior: rol, sede */}
      <div className="grid gap-3 xl:grid-cols-2">
        <Card className="py-3">
          <CardHeader className="px-3.5 pb-1">
            <CardTitle className="text-[13px]">Tipos de participantes</CardTitle>
          </CardHeader>
          <CardContent className="px-3.5">
            <RankedBarChart titulo="" datos={rolDatos} alturaFila={30} truncarEn={20} ocultarAccion />
          </CardContent>
        </Card>

        <Card className="py-3">
          <CardHeader className="px-3.5 pb-1">
            <CardTitle className="text-[13px]">Participantes por sede</CardTitle>
          </CardHeader>
          <CardContent className="px-3.5">
            <SedeBarList distribucion={distribucionSede} compacto />
          </CardContent>
        </Card>
      </div>

      {/* Fila inferior: las 4 preguntas estratégicas */}
      <div className="grid gap-3 md:grid-cols-2">
        {PREGUNTAS.map((pregunta) => (
          <Card key={pregunta.id} className="py-3">
            <CardHeader className="px-3.5 pb-1">
              <CardTitle className="text-[13px] leading-snug font-semibold">{pregunta.texto}</CardTitle>
            </CardHeader>
            <CardContent className="px-3.5">
              <RankedBarChart
                titulo=""
                datos={rankingPreguntas[pregunta.id].map((d) => ({
                  etiqueta: d.opcion,
                  conteo: d.conteo,
                  porcentaje: d.porcentaje,
                }))}
                alturaFila={34}
                truncarEn={32}
                ocultarAccion
              />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
