"use client";

import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RankedBarChart } from "@/components/charts/ranked-bar-chart";
import { OtroPanel, type RespuestaOtro } from "@/components/charts/otro-panel";
import { FilterBar } from "@/components/layout/filter-bar";
import { formatPorcentaje } from "@/lib/formatters";
import { PREGUNTAS } from "@/constants/preguntas";
import { useResumenFiltrado, type ResumenFiltrado } from "@/hooks/use-resumen-filtrado";

interface MatrizCruce {
  topB: string[];
  filas: { opcionA: string; celdas: { opcionB: string; porcentaje: number }[] }[];
}

export function VisionEstrategicaClient({
  inicial,
  respuestasOtro,
  cruce,
}: {
  inicial: ResumenFiltrado;
  respuestasOtro: RespuestaOtro[];
  cruce: MatrizCruce;
}) {
  const { data, hayFiltros, isFetching } = useResumenFiltrado();
  const resumen = hayFiltros && data ? data : inicial;
  const { rankingPreguntas } = resumen;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-heading text-xl font-bold text-foreground lg:text-2xl">Visión estratégica</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Las 4 preguntas de selección múltiple que orientan la construcción del Plan Estratégico
            {isFetching ? (
              <Loader2 className="ml-1.5 inline size-3 animate-spin align-[-2px] text-primary" aria-label="Actualizando" />
            ) : null}
          </p>
        </div>
        <FilterBar />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {PREGUNTAS.map((pregunta) => (
          <Card key={pregunta.id} className="py-3">
            <CardHeader className="px-3.5 pb-1">
              <CardTitle className="text-[13px] leading-snug font-semibold">
                {pregunta.id} · {pregunta.texto}
              </CardTitle>
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
                truncarEn={44}
                ocultarAccion
              />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="py-3">
        <CardHeader className="px-3.5 pb-1">
          <CardTitle className="text-[13px]">Coherencia narrativa: P3 → P4</CardTitle>
          <p className="text-[11px] text-muted-foreground">
            De quienes eligieron cada decisión estratégica prioritaria (P3), % que también eligió cada visión a 10
            años (P4). Vista global, no varía con los filtros.
          </p>
        </CardHeader>
        <CardContent className="overflow-x-auto px-3.5">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[220px]">P3 (decisión prioritaria)</TableHead>
                {cruce.topB.map((opcionB) => (
                  <TableHead key={opcionB} className="min-w-[160px] text-right">
                    {opcionB.length > 40 ? `${opcionB.slice(0, 40)}…` : opcionB}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {cruce.filas.map((fila) => (
                <TableRow key={fila.opcionA}>
                  <TableCell className="max-w-[260px] text-[13px]">{fila.opcionA}</TableCell>
                  {fila.celdas.map((celda) => (
                    <TableCell key={celda.opcionB} className="text-right text-[13px] tabular-nums">
                      {formatPorcentaje(celda.porcentaje)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="py-3">
        <CardHeader className="px-3.5 pb-1">
          <CardTitle className="text-[13px]">Respuestas abiertas (&ldquo;Otro&rdquo;)</CardTitle>
          <p className="text-[11px] text-muted-foreground">
            Texto libre genuino fuera de las opciones cerradas — {respuestasOtro.length} respuestas en total.
          </p>
        </CardHeader>
        <CardContent className="px-3.5">
          <OtroPanel respuestas={respuestasOtro} />
        </CardContent>
      </Card>
    </div>
  );
}
