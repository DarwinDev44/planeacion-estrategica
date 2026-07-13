"use client";

import { useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { BusquedaRapidaConferencistas } from "@/components/conferencistas/busqueda-rapida-conferencistas";
import { CarouselConferencistas, type CarouselConferencistasHandle } from "@/components/conferencistas/carousel-conferencistas";
import { DetalleConferencista } from "@/components/conferencistas/detalle-conferencista";
import type { ConferenciaConValoracion } from "@/types/conferencistas";

const DURACION_RESALTADO_MS = 1500;

/**
 * Orquesta el carrusel + la búsqueda rápida + el modal de detalle: dueño del
 * estado que las tres piezas necesitan compartir (cuál card está abierta en
 * el modal, cuál acaba de ser encontrada por la búsqueda) sin que el
 * carrusel y la búsqueda tengan que conocerse entre sí directamente.
 */
export function ConferencistasExplorador({ conferencias }: { conferencias: ConferenciaConValoracion[] }) {
  const [seleccionada, setSeleccionada] = useState<ConferenciaConValoracion | null>(null);
  const [resaltadaId, setResaltadaId] = useState<number | null>(null);
  const carruselRef = useRef<CarouselConferencistasHandle>(null);
  const temporizadorResaltado = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prefiereReducido = useReducedMotion();

  function irYResaltar(id: number) {
    carruselRef.current?.irA(id);
    setResaltadaId(id);
    if (temporizadorResaltado.current) clearTimeout(temporizadorResaltado.current);
    temporizadorResaltado.current = setTimeout(() => setResaltadaId(null), DURACION_RESALTADO_MS);
  }

  return (
    <div className="flex flex-col gap-4">
      <BusquedaRapidaConferencistas conferencias={conferencias} onSeleccionar={irYResaltar} />

      <motion.div
        initial={prefiereReducido ? undefined : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <CarouselConferencistas
          ref={carruselRef}
          conferencias={conferencias}
          onSeleccionar={setSeleccionada}
          resaltadaId={resaltadaId}
        />
      </motion.div>

      <DetalleConferencista conferencia={seleccionada} onCerrar={() => setSeleccionada(null)} />
    </div>
  );
}
