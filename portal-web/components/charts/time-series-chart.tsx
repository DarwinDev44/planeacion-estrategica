"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatFecha, formatNumero } from "@/lib/formatters";

export interface PuntoSerieTiempo {
  fecha: string;
  conteo: number;
}

function calcularTicksEje(valores: number[], pasos = 4): number[] {
  const max = Math.max(1, ...valores);
  const magnitud = 10 ** Math.floor(Math.log10(max));
  const paso = Math.ceil(max / pasos / magnitud) * magnitud;
  const techo = paso * pasos;
  return Array.from({ length: pasos + 1 }, (_, i) => i * paso).filter((t) => t <= techo);
}

export function TimeSeriesChart({ datos }: { datos: PuntoSerieTiempo[] }) {
  const ticks = calcularTicksEje(datos.map((d) => d.conteo));
  const techo = ticks[ticks.length - 1];

  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={datos} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="serieTiempoFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis
            dataKey="fecha"
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            tickLine={false}
            axisLine={{ stroke: "var(--border)" }}
            tickFormatter={(v: string) => formatFecha(v).replace(".", "")}
            interval="preserveStartEnd"
            minTickGap={40}
          />
          <YAxis
            type="number"
            domain={[0, techo]}
            ticks={ticks}
            allowDecimals={false}
            tickFormatter={(v: number) => formatNumero(v)}
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            tickLine={false}
            axisLine={false}
            width={56}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0].payload as PuntoSerieTiempo;
              return (
                <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-md">
                  <p className="font-medium text-popover-foreground">{formatFecha(d.fecha)}</p>
                  <p className="mt-1 text-muted-foreground">{formatNumero(d.conteo)} respuestas</p>
                </div>
              );
            }}
          />
          <Area
            type="monotone"
            dataKey="conteo"
            stroke="var(--primary)"
            strokeWidth={2}
            fill="url(#serieTiempoFill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
