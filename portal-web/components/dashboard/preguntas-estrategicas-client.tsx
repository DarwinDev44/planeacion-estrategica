"use client";

import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RankedBarChart } from "@/components/charts/ranked-bar-chart";
import { OtroPanel, type RespuestaOtro } from "@/components/charts/otro-panel";
import { AnalisisOtroCards } from "@/components/dashboard/analisis-otro";
import { FilterBar } from "@/components/layout/filter-bar";
import { PREGUNTAS } from "@/constants/preguntas";
import { useResumenFiltrado, type ResumenFiltrado } from "@/hooks/use-resumen-filtrado";
import type { AnalisisOtro, PreguntaId } from "@/types/encuesta";

/**
 * Render de un subconjunto de las preguntas de selección múltiple (una tarjeta
 * por pregunta) más el panel de respuestas abiertas ("Otro") acotado a esas
 * mismas preguntas. Se reutiliza en "Visión estratégica" (P3, P4) y en
 * "Fundamentos de planeación" (P1, P2); la única diferencia entre ambas
 * páginas es el título, la descripción y qué preguntas muestran.
 */
export function PreguntasEstrategicasClient({
  titulo,
  descripcion,
  preguntasIds,
  inicial,
  respuestasOtro,
  analisisOtro,
}: {
  titulo: string;
  descripcion: string;
  preguntasIds: PreguntaId[];
  inicial: ResumenFiltrado;
  respuestasOtro: RespuestaOtro[];
  analisisOtro?: AnalisisOtro;
}) {
  const { data, hayFiltros, isFetching } = useResumenFiltrado();
  const resumen = hayFiltros && data ? data : inicial;
  const { rankingPreguntas } = resumen;

  const preguntas = PREGUNTAS.filter((pregunta) => preguntasIds.includes(pregunta.id));
  const otroFiltradas = respuestasOtro.filter((r) => preguntasIds.includes(r.preguntaId));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-heading text-xl font-bold text-foreground lg:text-2xl">{titulo}</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {descripcion}
            {isFetching ? (
              <Loader2 className="ml-1.5 inline size-3 animate-spin align-[-2px] text-primary" aria-label="Actualizando" />
            ) : null}
          </p>
        </div>
        <FilterBar />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {preguntas.map((pregunta) => (
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

      {analisisOtro && otroFiltradas.length > 0 ? <AnalisisOtroCards analisis={analisisOtro} /> : null}

      {otroFiltradas.length > 0 ? (
        <Card className="py-3">
          <CardHeader className="px-3.5 pb-1">
            <CardTitle className="text-[13px]">Respuestas abiertas (&ldquo;Otro&rdquo;)</CardTitle>
            <p className="text-[11px] text-muted-foreground">
              Texto libre genuino fuera de las opciones cerradas — {otroFiltradas.length} respuestas en total.
            </p>
          </CardHeader>
          <CardContent className="px-3.5">
            <OtroPanel respuestas={otroFiltradas} />
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
