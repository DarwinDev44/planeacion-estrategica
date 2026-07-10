import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RankedBarChart } from "@/components/charts/ranked-bar-chart";
import { OtroPanel } from "@/components/charts/otro-panel";
import { formatPorcentaje } from "@/lib/formatters";
import { PREGUNTAS } from "@/constants/preguntas";
import {
  getRankingPreguntasPreagregado,
  getRespuestasOtroPreagregadas,
  getMatrizCruce,
} from "@/repositories/encuestaRepository";

export const metadata: Metadata = { title: "Visión estratégica" };

export default function VisionEstrategicaPage() {
  const rankingPreguntas = getRankingPreguntasPreagregado();
  const respuestasOtro = getRespuestasOtroPreagregadas();
  const cruce = getMatrizCruce("P3", "P4", 3);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground lg:text-3xl">Visión estratégica</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Las 4 preguntas de selección múltiple que orientan la construcción del Plan Estratégico Universitario.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {PREGUNTAS.map((pregunta) => (
          <Card key={pregunta.id}>
            <CardHeader>
              <CardTitle className="text-sm font-semibold leading-snug">
                {pregunta.id} · {pregunta.texto}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RankedBarChart
                titulo=""
                datos={rankingPreguntas[pregunta.id].map((d) => ({
                  etiqueta: d.opcion,
                  conteo: d.conteo,
                  porcentaje: d.porcentaje,
                }))}
                alturaFila={46}
              />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Coherencia narrativa: P3 → P4</CardTitle>
          <p className="text-xs text-muted-foreground">
            De quienes eligieron cada decisión estratégica prioritaria (P3), % que también eligió cada visión a 10
            años (P4). Muestra si la comunidad es consistente entre lo que prioriza hoy y cómo imagina el futuro.
          </p>
        </CardHeader>
        <CardContent className="overflow-x-auto">
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
                  <TableCell className="max-w-[260px] text-sm">{fila.opcionA}</TableCell>
                  {fila.celdas.map((celda) => (
                    <TableCell key={celda.opcionB} className="text-right tabular-nums">
                      {formatPorcentaje(celda.porcentaje)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Respuestas abiertas (&ldquo;Otro&rdquo;)</CardTitle>
          <p className="text-xs text-muted-foreground">
            Texto libre genuino fuera de las opciones cerradas — {respuestasOtro.length} respuestas en total entre
            todas las preguntas.
          </p>
        </CardHeader>
        <CardContent>
          <OtroPanel respuestas={respuestasOtro} />
        </CardContent>
      </Card>
    </div>
  );
}
