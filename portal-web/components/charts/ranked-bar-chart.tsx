"use client";

import { useId, useState } from "react";
import type { BarShapeProps } from "recharts";
import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Table2, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatNumero, formatPorcentaje } from "@/lib/formatters";

export interface RankedBarDatum {
  etiqueta: string;
  conteo: number;
  porcentaje: number;
}

interface RankedBarChartProps {
  datos: RankedBarDatum[];
  titulo: string;
  descripcion?: string;
  colores?: string[]; // opcional: paleta categórica. Por defecto, un solo verde institucional (estilo reporte).
  alturaFila?: number;
  truncarEn?: number;
  ocultarAccion?: boolean;
}

export function RankedBarChart({
  datos,
  titulo,
  descripcion,
  colores,
  alturaFila = 32,
  truncarEn = 26,
  ocultarAccion = false,
}: RankedBarChartProps) {
  const [vistaTabla, setVistaTabla] = useState(false);
  const id = useId();
  const ordenados = [...datos].sort((a, b) => b.conteo - a.conteo);

  function barraRedondeada(props: BarShapeProps) {
    const { x, y, width, height, index } = props;
    const fill = colores ? colores[index % colores.length] : "var(--primary)";
    return <rect x={x} y={y} width={Math.max(width, 1)} height={height} rx={3} ry={3} fill={fill} />;
  }

  return (
    <section aria-labelledby={`${id}-titulo`} className="flex h-full flex-col gap-2">
      {titulo || !ocultarAccion ? (
        <div className="flex items-start justify-between gap-2">
          {titulo ? (
            <h3 id={`${id}-titulo`} className="text-[13px] font-semibold leading-tight text-foreground">
              {titulo}
            </h3>
          ) : (
            <span />
          )}
          {!ocultarAccion ? (
            <Button
              variant="ghost"
              size="icon"
              className="size-6 shrink-0 text-muted-foreground hover:text-foreground"
              onClick={() => setVistaTabla((v) => !v)}
              aria-pressed={vistaTabla}
              aria-label={vistaTabla ? "Ver gráfico" : "Ver tabla"}
              title={vistaTabla ? "Ver gráfico" : "Ver tabla"}
            >
              {vistaTabla ? <BarChart3 className="size-3.5" /> : <Table2 className="size-3.5" />}
            </Button>
          ) : null}
        </div>
      ) : null}

      {vistaTabla ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Opción</TableHead>
              <TableHead className="text-right">Respuestas</TableHead>
              <TableHead className="text-right">%</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ordenados.map((d) => (
              <TableRow key={d.etiqueta}>
                <TableCell className="max-w-md">{d.etiqueta}</TableCell>
                <TableCell className="text-right tabular-nums">{formatNumero(d.conteo)}</TableCell>
                <TableCell className="text-right tabular-nums">{formatPorcentaje(d.porcentaje)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <div style={{ height: Math.max(ordenados.length * alturaFila, 90) }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={ordenados}
              layout="vertical"
              margin={{ top: 2, right: 40, bottom: 2, left: 2 }}
              barCategoryGap={6}
            >
              <CartesianGrid horizontal={false} stroke="var(--border)" />
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="etiqueta"
                width={truncarEn * 6}
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: string) => (v.length > truncarEn ? `${v.slice(0, truncarEn)}…` : v)}
              />
              <Tooltip
                cursor={{ fill: "var(--muted)" }}
                allowEscapeViewBox={{ x: false, y: false }}
                wrapperStyle={{ zIndex: 20 }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload as RankedBarDatum;
                  return (
                    <div className="max-w-[200px] rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-md">
                      <p className="font-medium break-words text-popover-foreground">{d.etiqueta}</p>
                      <p className="mt-1 text-muted-foreground">
                        {formatNumero(d.conteo)} respuestas · {formatPorcentaje(d.porcentaje)}
                      </p>
                    </div>
                  );
                }}
              />
              <Bar dataKey="conteo" shape={barraRedondeada} maxBarSize={18}>
                <LabelList
                  dataKey="conteo"
                  position="right"
                  formatter={(v: unknown) => formatNumero(Number(v ?? 0))}
                  className="fill-foreground text-[11px] font-semibold tabular-nums"
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
