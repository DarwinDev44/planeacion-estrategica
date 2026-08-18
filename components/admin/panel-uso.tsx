"use client";

import { useState, useTransition } from "react";
import { TableroUso } from "@/components/admin/tablero-uso";
import { obtenerMetricasUso } from "@/app/admin/acciones";
import type { MetricasUso } from "@/types/metricas";

/**
 * Envoltorio del tablero: guarda el rango elegido y pide los datos al
 * servidor cuando cambia. El primer rango llega ya resuelto desde la página,
 * así que el tablero se pinta completo sin esperar a una petición del cliente.
 */
export function PanelUso({
  metricasIniciales,
  diasIniciales,
}: {
  metricasIniciales: MetricasUso;
  diasIniciales: number;
}) {
  const [metricas, setMetricas] = useState(metricasIniciales);
  const [dias, setDias] = useState(diasIniciales);
  const [cargando, iniciarCarga] = useTransition();

  function cambiarRango(nuevos: number) {
    if (nuevos === dias) return;
    iniciarCarga(async () => {
      const respuesta = await obtenerMetricasUso(nuevos);
      // null = la sesión venció; se deja lo que ya estaba en pantalla en vez de
      // vaciar el tablero, que parecería que no hay datos.
      if (respuesta) {
        setMetricas(respuesta);
        setDias(nuevos);
      }
    });
  }

  return (
    <TableroUso
      metricas={metricas}
      dias={dias}
      onCambiarRango={cambiarRango}
      cargando={cargando}
    />
  );
}
