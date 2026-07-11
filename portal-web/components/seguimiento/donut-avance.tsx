"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { ArrowRight } from "lucide-react";
import { formatPorcentaje } from "@/lib/formatters";

interface DonutAvanceProps {
  avanceGeneral: number;
  totalFinalizados: number;
  totalNoFinalizados: number;
  onVerDetalle: () => void;
}

const COLOR_FINALIZADO = "var(--estado-finalizado)";
const COLOR_PENDIENTE = "var(--estado-pendiente)";

export function DonutAvance({
  avanceGeneral,
  totalFinalizados,
  totalNoFinalizados,
  onVerDetalle,
}: DonutAvanceProps) {
  const datos = [
    { nombre: "Finalizado", valor: totalFinalizados, color: COLOR_FINALIZADO },
    { nombre: "No finalizado", valor: totalNoFinalizados, color: COLOR_PENDIENTE },
  ];

  return (
    <div className="flex flex-col items-center gap-4">
      <button
        type="button"
        onClick={onVerDetalle}
        aria-label={`Avance general ${formatPorcentaje(avanceGeneral)}. Ver detalle por actividad`}
        className="group relative mx-auto block h-64 w-64 cursor-pointer rounded-full outline-none transition-transform hover:scale-[1.02] focus-visible:ring-[3px] focus-visible:ring-ring/50 sm:h-72 sm:w-72 [&_*]:cursor-pointer!"
      >
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={datos}
              dataKey="valor"
              nameKey="nombre"
              innerRadius="72%"
              outerRadius="100%"
              startAngle={90}
              endAngle={-270}
              paddingAngle={1}
              cornerRadius={4}
              stroke="var(--card)"
              strokeWidth={2}
              isAnimationActive={false}
            >
              {datos.map((d) => (
                <Cell key={d.nombre} fill={d.color} />
              ))}
            </Pie>
            <Tooltip
              cursor={false}
              content={({ active, payload }) => {
                const total = totalFinalizados + totalNoFinalizados;
                return active && payload?.length && total > 0 ? (
                  <div className="rounded-md border border-border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md">
                    <span className="font-medium">{payload[0].name}</span>:{" "}
                    <span className="tabular-nums">
                      {formatPorcentaje((Number(payload[0].value) / total) * 100)}
                    </span>
                  </div>
                ) : null;
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        {/* Cifra central */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-heading text-4xl font-bold tabular-nums text-foreground sm:text-5xl">
            {formatPorcentaje(avanceGeneral)}
          </span>
          <span className="mt-1 text-xs text-muted-foreground">avance general</span>
          <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary opacity-80 transition-opacity group-hover:opacity-100">
            Ver detalle por actividad
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
          </span>
        </div>
      </button>

      {/* Leyenda con etiquetas directas (requisito de contraste de la paleta) */}
      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
        <span className="inline-flex items-center gap-2">
          <span className="size-3 rounded-full" style={{ background: COLOR_FINALIZADO }} aria-hidden />
          <span className="text-muted-foreground">Finalizado</span>
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="size-3 rounded-full" style={{ background: COLOR_PENDIENTE }} aria-hidden />
          <span className="text-muted-foreground">No finalizado</span>
        </span>
      </div>
    </div>
  );
}
