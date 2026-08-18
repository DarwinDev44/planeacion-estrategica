"use client";

import { useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Eye, MousePointerClick, TrendingUp, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { KpiCard } from "@/components/kpi/kpi-card";
import { RankedBarChart } from "@/components/charts/ranked-bar-chart";
import { cn } from "@/lib/utils";
import { formatNumero } from "@/lib/formatters";
import { NAVEGACION } from "@/constants/navegacion";
import type { MetricasUso } from "@/types/metricas";

/** Rangos que ofrece el tablero, en días hacia atrás desde hoy. */
export const RANGOS = [7, 30, 90] as const;

const formatoDiaCorto = new Intl.DateTimeFormat("es-CO", { day: "2-digit", month: "short" });
const formatoDiaLargo = new Intl.DateTimeFormat("es-CO", { dateStyle: "long" });

/** Nombre legible de una ruta; si no está en el menú, se muestra la ruta. */
const ETIQUETA_POR_RUTA = new Map<string, string>([
  ["/", "Portada"],
  ...NAVEGACION.map((item) => [item.href, item.etiqueta] as [string, string]),
]);

export function TableroUso({
  metricas,
  dias,
  onCambiarRango,
  cargando,
}: {
  metricas: MetricasUso;
  dias: number;
  onCambiarRango: (dias: number) => void;
  cargando: boolean;
}) {
  const [serie, setSerie] = useState<"visitas" | "sesiones" | "clics">("visitas");

  const sinDatos = metricas.visitas === 0 && metricas.clics === 0;
  const masVisitada = metricas.porSeccion[0];
  const diaPico = [...metricas.porDia].sort((a, b) => b.visitas - a.visitas)[0];

  const datosSerie = metricas.porDia.map((d) => ({
    dia: d.dia,
    etiqueta: formatoDiaCorto.format(new Date(`${d.dia}T12:00:00`)),
    valor: d[serie],
  }));

  return (
    <Card className="border-border/70">
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2.5">
          Uso del portal
          <Badge variant="secondary">
            {formatoDiaLargo.format(new Date(`${metricas.desde}T12:00:00`))} –{" "}
            {formatoDiaLargo.format(new Date(`${metricas.hasta}T12:00:00`))}
          </Badge>
          <span className="ml-auto flex items-center gap-1">
            {RANGOS.map((rango) => (
              <Button
                key={rango}
                type="button"
                size="sm"
                variant={rango === dias ? "default" : "ghost"}
                disabled={cargando}
                onClick={() => onCambiarRango(rango)}
              >
                {rango} días
              </Button>
            ))}
          </span>
        </CardTitle>
        <CardDescription>
          Visitas y clics registrados por sección. Los contadores son agregados por día: no se
          guarda quién navega, ni su recorrido, ni su dirección IP. La propia vista de
          administración no se contabiliza.
        </CardDescription>
      </CardHeader>

      <CardContent className={cn("flex flex-col gap-6", cargando && "opacity-60")}>
        {sinDatos ? (
          <p className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
            Todavía no hay actividad registrada en este rango. Los contadores empiezan a sumar en
            cuanto alguien visite una sección del portal.
          </p>
        ) : null}

        <div className="grid grid-cols-4 gap-4">
          <KpiCard
            etiqueta="Visitas"
            valor={formatNumero(metricas.visitas)}
            detalle="Páginas abiertas"
            icono={Eye}
          />
          <KpiCard
            etiqueta="Sesiones"
            valor={formatNumero(metricas.sesiones)}
            detalle="Visitas únicas aproximadas"
            icono={Users}
          />
          <KpiCard
            etiqueta="Clics"
            valor={formatNumero(metricas.clics)}
            detalle="Sobre filtros, gráficos y enlaces"
            icono={MousePointerClick}
          />
          <KpiCard
            etiqueta="Clics por visita"
            valor={metricas.clicsPorVisita.toFixed(1)}
            detalle={metricas.clicsPorVisita >= 3 ? "Uso a fondo" : "Consulta rápida"}
            icono={TrendingUp}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Card className="border-border/70">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Evolución diaria
                <span className="ml-auto flex items-center gap-1">
                  {(["visitas", "sesiones", "clics"] as const).map((clave) => (
                    <Button
                      key={clave}
                      type="button"
                      size="xs"
                      variant={clave === serie ? "secondary" : "ghost"}
                      onClick={() => setSerie(clave)}
                    >
                      {clave}
                    </Button>
                  ))}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={datosSerie} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
                    <defs>
                      <linearGradient id="degradado-uso" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.28} />
                        <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} stroke="var(--border)" />
                    <XAxis
                      dataKey="etiqueta"
                      tickLine={false}
                      axisLine={false}
                      interval="preserveStartEnd"
                      minTickGap={24}
                      tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                    />
                    <YAxis
                      allowDecimals={false}
                      tickLine={false}
                      axisLine={false}
                      width={44}
                      tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                    />
                    <Tooltip
                      cursor={{ stroke: "var(--border)" }}
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const d = payload[0].payload as (typeof datosSerie)[number];
                        return (
                          <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-md">
                            <p className="font-medium text-popover-foreground">
                              {formatoDiaLargo.format(new Date(`${d.dia}T12:00:00`))}
                            </p>
                            <p className="mt-1 text-muted-foreground">
                              {formatNumero(d.valor)} {serie}
                            </p>
                          </div>
                        );
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="valor"
                      stroke="var(--primary)"
                      strokeWidth={2}
                      fill="url(#degradado-uso)"
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/70">
            <CardContent>
              <RankedBarChart
                titulo="Visitas por sección"
                datos={metricas.porSeccion.map((s) => ({
                  etiqueta: ETIQUETA_POR_RUTA.get(s.seccion) ?? s.seccion,
                  conteo: s.visitas,
                  porcentaje: metricas.visitas > 0 ? (s.visitas / metricas.visitas) * 100 : 0,
                }))}
              />
            </CardContent>
          </Card>
        </div>

        {masVisitada ? (
          <div className="grid grid-cols-3 gap-4">
            <Destacado
              titulo="Sección más visitada"
              valor={ETIQUETA_POR_RUTA.get(masVisitada.seccion) ?? masVisitada.seccion}
              detalle={`${formatNumero(masVisitada.visitas)} visitas`}
            />
            <Destacado
              titulo="Sección menos visitada"
              valor={
                ETIQUETA_POR_RUTA.get(metricas.porSeccion[metricas.porSeccion.length - 1].seccion) ??
                metricas.porSeccion[metricas.porSeccion.length - 1].seccion
              }
              detalle={`${formatNumero(metricas.porSeccion[metricas.porSeccion.length - 1].visitas)} visitas`}
            />
            <Destacado
              titulo="Día con más visitas"
              valor={
                diaPico && diaPico.visitas > 0
                  ? formatoDiaLargo.format(new Date(`${diaPico.dia}T12:00:00`))
                  : "—"
              }
              detalle={diaPico ? `${formatNumero(diaPico.visitas)} visitas` : ""}
            />
          </div>
        ) : null}

        <div>
          <p className="mb-2 text-sm font-medium text-foreground">Detalle por sección</p>
          <Table className="table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[46%] whitespace-normal">Sección</TableHead>
                <TableHead className="w-[13%] text-right">Visitas</TableHead>
                <TableHead className="w-[13%] text-right">Sesiones</TableHead>
                <TableHead className="w-[13%] text-right">Clics</TableHead>
                <TableHead className="w-[15%] text-right">Clics/visita</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {metricas.porSeccion.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Sin actividad en este rango.
                  </TableCell>
                </TableRow>
              ) : (
                metricas.porSeccion.map((s) => (
                  <TableRow key={s.seccion}>
                    <TableCell className="whitespace-normal font-medium">
                      {ETIQUETA_POR_RUTA.get(s.seccion) ?? s.seccion}
                      <span className="ml-1.5 font-mono text-xs text-muted-foreground">
                        {s.seccion}
                      </span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumero(s.visitas)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumero(s.sesiones)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumero(s.clics)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {s.visitas > 0 ? (s.clics / s.visitas).toFixed(1) : "—"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function Destacado({
  titulo,
  valor,
  detalle,
}: {
  titulo: string;
  valor: string;
  detalle: string;
}) {
  return (
    <div className="rounded-lg border border-border/70 bg-muted/40 px-4 py-3">
      <p className="text-xs text-muted-foreground">{titulo}</p>
      <p className="mt-0.5 text-sm font-medium text-foreground">{valor}</p>
      <p className="text-xs text-muted-foreground">{detalle}</p>
    </div>
  );
}
