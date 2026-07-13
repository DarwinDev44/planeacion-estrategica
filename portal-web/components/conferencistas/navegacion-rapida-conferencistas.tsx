"use client";

import { CalendarDays, MapPin } from "lucide-react";
import { AvatarConferencista } from "@/components/conferencistas/avatar-conferencista";
import type { ConferenciaConValoracion } from "@/types/conferencistas";

/**
 * Lista de acceso rápido, en el mismo orden cronológico del carrusel: cada
 * fila es un atajo directo a su card, sin scroll ni buscador (con 12
 * conferencistas todas caben listadas). Va debajo del carrusel a modo de
 * índice de lo ya explorado arriba.
 */
export function NavegacionRapidaConferencistas({
  conferencias,
  onSeleccionar,
}: {
  conferencias: ConferenciaConValoracion[];
  onSeleccionar: (id: number) => void;
}) {
  return (
    <ol className="flex flex-col divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
      {conferencias.map((c, indice) => (
        <li key={c.id}>
          <button
            type="button"
            onClick={() => onSeleccionar(c.id)}
            className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-primary/5"
          >
            <span className="w-6 shrink-0 text-right text-xs font-semibold text-muted-foreground tabular-nums">
              {indice + 1}
            </span>
            <AvatarConferencista conferencia={c} tamaño={32} sinFloral />
            <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">{c.nombre}</span>
            <span className="inline-flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
              <CalendarDays className="size-3.5 shrink-0 text-primary" aria-hidden />
              {c.fecha}
            </span>
            <span className="inline-flex w-32 shrink-0 items-center gap-1 truncate text-xs text-muted-foreground">
              <MapPin className="size-3.5 shrink-0 text-primary" aria-hidden />
              {c.ubicacion}
            </span>
          </button>
        </li>
      ))}
    </ol>
  );
}
