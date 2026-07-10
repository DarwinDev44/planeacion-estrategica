"use client";

import { formatPorcentaje } from "@/lib/formatters";

/**
 * Pastel (donut) miniatura en SVG puro: porción verde = finalizado,
 * porción ámbar = pendiente. El % siempre va como etiqueta directa al lado.
 */
export function MiniPastel({ porcentaje, tamano = 40 }: { porcentaje: number; tamano?: number }) {
  const radio = 15.5;
  const circunferencia = 2 * Math.PI * radio;
  const arcoFinalizado = (porcentaje / 100) * circunferencia;

  return (
    <span className="inline-flex items-center gap-2.5">
      <svg
        width={tamano}
        height={tamano}
        viewBox="0 0 40 40"
        role="img"
        aria-label={`${formatPorcentaje(porcentaje)} de finalización`}
        className="-rotate-90"
      >
        <circle
          cx="20"
          cy="20"
          r={radio}
          fill="none"
          stroke="var(--estado-pendiente)"
          strokeWidth="7"
          opacity={porcentaje >= 100 ? 0 : 1}
        />
        <circle
          cx="20"
          cy="20"
          r={radio}
          fill="none"
          stroke="var(--estado-finalizado)"
          strokeWidth="7"
          strokeDasharray={`${arcoFinalizado} ${circunferencia}`}
          strokeLinecap={porcentaje >= 100 ? "butt" : "round"}
        />
      </svg>
      <span className="w-14 text-right font-semibold tabular-nums text-foreground">
        {formatPorcentaje(porcentaje)}
      </span>
    </span>
  );
}
