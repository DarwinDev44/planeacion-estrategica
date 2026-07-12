"use client";

import { useState } from "react";
import { ConferencistaCard } from "@/components/conferencistas/conferencista-card";
import { DetalleConferencista } from "@/components/conferencistas/detalle-conferencista";
import type { ConferenciaCard } from "@/types/conferencistas";

export function ConferencistasGrid({ conferencias }: { conferencias: ConferenciaCard[] }) {
  const [seleccionada, setSeleccionada] = useState<ConferenciaCard | null>(null);

  return (
    <>
      <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {conferencias.map((c) => (
          <ConferencistaCard key={c.id} conferencia={c} onSeleccionar={setSeleccionada} />
        ))}
      </div>
      <DetalleConferencista conferencia={seleccionada} onCerrar={() => setSeleccionada(null)} />
    </>
  );
}
