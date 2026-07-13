"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { AvatarConferencista } from "@/components/conferencistas/avatar-conferencista";
import { Input } from "@/components/ui/input";
import { coincideBusqueda } from "@/lib/buscar";
import type { ConferenciaConValoracion } from "@/types/conferencistas";

/**
 * Navegación rápida por miniaturas: encontrar a alguien sin recorrer todo el
 * carrusel. El clic no filtra ni reemplaza el carrusel — lo desplaza hasta
 * la card correspondiente y la resalta (ver onSeleccionar / resaltadaId en
 * el componente padre).
 */
export function BusquedaRapidaConferencistas({
  conferencias,
  onSeleccionar,
}: {
  conferencias: ConferenciaConValoracion[];
  onSeleccionar: (id: number) => void;
}) {
  const [busqueda, setBusqueda] = useState("");

  const filtrados = useMemo(
    () => conferencias.filter((c) => coincideBusqueda(busqueda, c.nombre)),
    [conferencias, busqueda]
  );

  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-muted/50 p-3">
      <div className="relative">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          type="search"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar conferencista por nombre…"
          aria-label="Buscar conferencista"
          className="border-transparent bg-card pl-9 shadow-sm"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {filtrados.length === 0 ? (
          <p className="px-1 py-2 text-xs text-muted-foreground">Sin coincidencias para "{busqueda}".</p>
        ) : (
          filtrados.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => onSeleccionar(c.id)}
              className="flex shrink-0 items-center gap-2 rounded-full border border-border bg-card py-1 pr-3.5 pl-1 text-left transition-colors hover:border-primary/40 hover:bg-primary/5"
            >
              <AvatarConferencista conferencia={c} tamaño={28} sinFloral />
              <span className="max-w-[9rem] truncate text-xs font-medium text-foreground">{c.nombre}</span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
