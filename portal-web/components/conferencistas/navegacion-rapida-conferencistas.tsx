"use client";

import { AvatarConferencista } from "@/components/conferencistas/avatar-conferencista";
import type { ConferenciaConValoracion } from "@/types/conferencistas";

/**
 * Navegación rápida por miniaturas: encontrar a alguien sin recorrer todo el
 * carrusel. Con solo 12 conferencistas, todas las miniaturas caben en
 * pantalla a la vez (envuelven en varias filas, sin scroll ni buscador) para
 * que cualquiera esté a un clic de distancia. El clic no filtra ni reemplaza
 * el carrusel — lo desplaza hasta la card correspondiente y la resalta (ver
 * onSeleccionar / resaltadaId en el componente padre).
 */
export function NavegacionRapidaConferencistas({
  conferencias,
  onSeleccionar,
}: {
  conferencias: ConferenciaConValoracion[];
  onSeleccionar: (id: number) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2 rounded-2xl bg-muted/50 p-3">
      {conferencias.map((c) => (
        <button
          key={c.id}
          type="button"
          onClick={() => onSeleccionar(c.id)}
          className="flex shrink-0 items-center gap-2 rounded-full border border-border bg-card py-1 pr-3.5 pl-1 text-left transition-colors hover:border-primary/40 hover:bg-primary/5"
        >
          <AvatarConferencista conferencia={c} tamaño={28} sinFloral />
          <span className="max-w-[9rem] truncate text-xs font-medium text-foreground">{c.nombre}</span>
        </button>
      ))}
    </div>
  );
}
