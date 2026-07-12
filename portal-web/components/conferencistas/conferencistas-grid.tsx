"use client";

import { useState } from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { ConferencistaCard } from "@/components/conferencistas/conferencista-card";
import { DetalleConferencista } from "@/components/conferencistas/detalle-conferencista";
import type { ConferenciaConValoracion } from "@/types/conferencistas";

const contenedor: Variants = {
  oculto: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
};

const item: Variants = {
  oculto: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

export function ConferencistasGrid({ conferencias }: { conferencias: ConferenciaConValoracion[] }) {
  const [seleccionada, setSeleccionada] = useState<ConferenciaConValoracion | null>(null);
  const prefiereReducido = useReducedMotion();

  return (
    <>
      {/*
        Masonry vía CSS columns en vez de grid: las cards varían de alto de
        forma natural (más o menos formación/trayectoria, con o sin bio
        extendida) y forzarlas a la misma altura de fila en un grid dejaba
        huecos que se leían como un error de alineación. Con columnas, cada
        card ocupa su alto real y el siguiente elemento sube a llenar el
        espacio — la variación de altura se percibe como ritmo intencional,
        no como descuido.
      */}
      <motion.div
        variants={prefiereReducido ? undefined : contenedor}
        initial={prefiereReducido ? undefined : "oculto"}
        animate={prefiereReducido ? undefined : "visible"}
        className="columns-1 gap-4 sm:columns-2 lg:columns-3 xl:columns-4"
      >
        {conferencias.map((c) => (
          <motion.div key={c.id} variants={prefiereReducido ? undefined : item}>
            <ConferencistaCard conferencia={c} onSeleccionar={setSeleccionada} />
          </motion.div>
        ))}
      </motion.div>
      <DetalleConferencista conferencia={seleccionada} onCerrar={() => setSeleccionada(null)} />
    </>
  );
}
