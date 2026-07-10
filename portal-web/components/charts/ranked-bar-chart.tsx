"use client";

import { useId, useState } from "react";
import type { BarShapeProps } from "recharts";
import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Table2, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatPorcentaje } from "@/lib/formatters";

export interface RankedBarDatum {
  etiqueta: string;
  conteo: number;
  porcentaje: number;
}

interface RankedBarChartProps {
  datos: RankedBarDatum[];
  titulo: string;
  descripcion?: string;
  colores?: string[]; // opcional: paleta categórica (ej. Rol). Por defecto usa un solo hue secuencial.
  alturaFila?: number;
}

export function RankedBarChart({
  datos,
  titulo,
  descripcion,
  colores,
  alturaFila = 40,
}: RankedBarChartProps) {
  const [vistaTabla, setVistaTabla] = useState(false);
  const id = useId();
  const ordenados = [...datos].sort((a, b) => b.conteo - a.conteo);

  function barraRedondeada(props: BarShapeProps) {
    const { x, y, width, height, index } = props;
    const fill = colores ? colores[index % colores.length] : "var(--primary)";
    return <rect x={x} y={y} width={width} height={height} rx={4} ry={4} fill={fill} />;
  }

  return (
    <section aria-labelledby={`${id}-titulo`} className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 id={`${id}-titulo`} className="text-sm font-semibold text-foreground">
            {titulo}
          </h3>
          {descripcion ? <p className="text-xs text-muted-foreground">{descripcion}</p> : null}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setVistaTabla((v) => !v)}
          aria-pressed={vistaTabla}
        >
          {vistaTabla ? <BarChart3 className="size-3.5" /> : <Table2 className="size-3.5" />}
          {vistaTabla ? "Ver gráfico" : "Ver tabla"}
        </Button>
      </div>

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
                <TableCell className="text-right tabular-nums">{d.conteo.toLocaleString("es-CO")}</TableCell>
                <TableCell className="text-right tabular-nums">{formatPorcentaje(d.porcentaje)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <div style={{ height: Math.max(ordenados.length * alturaFila, 120) }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={ordenados}
              layout="vertical"
              margin={{ top: 4, right: 48, bottom: 4, left: 4 }}
              barCategoryGap={10}
            >
              <CartesianGrid horizontal={false} stroke="var(--border)" />
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="etiqueta"
                width={220}
                tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: string) => (v.length > 34 ? `${v.slice(0, 34)}…` : v)}
              />
              <Tooltip
                cursor={{ fill: "var(--muted)" }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload as RankedBarDatum;
                  return (
                    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-md">
                      <p className="max-w-[240px] font-medium text-popover-foreground">{d.etiqueta}</p>
                      <p className="mt-1 text-muted-foreground">
                        {d.conteo.toLocaleString("es-CO")} respuestas · {formatPorcentaje(d.porcentaje)}
                      </p>
                    </div>
                  );
                }}
              />
              <Bar dataKey="conteo" shape={barraRedondeada} maxBarSize={22}>
                <LabelList
                  dataKey="porcentaje"
                  position="right"
                  formatter={(v: unknown) => formatPorcentaje(Number(v ?? 0))}
                  className="fill-foreground text-xs font-medium tabular-nums"
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
