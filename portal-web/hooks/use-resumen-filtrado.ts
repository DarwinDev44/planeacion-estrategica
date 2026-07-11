"use client";

import { useQuery } from "@tanstack/react-query";
import { useFiltrosStore } from "@/store/filtros";
import type { PreguntaId } from "@/types/encuesta";

export interface ResumenFiltrado {
  kpis: {
    totalParticipantes: number;
    totalAsignacionesRol: number;
    sedesConParticipacion: number;
    programasRepresentados: number;
    personasConMultiRol: number;
  };
  distribucionRol: Record<string, number>;
  distribucionSede: Record<string, number>;
  rankingPreguntas: Record<PreguntaId, { opcion: string; conteo: number; porcentaje: number }[]>;
  serieTiempo: { fecha: string; conteo: number }[];
}

function construirQueryString(filtros: {
  rol?: string[];
  sede?: string[];
  facultad?: string[];
  programaOArea?: string[];
}) {
  const params = new URLSearchParams();
  if (filtros.rol?.length) params.set("rol", filtros.rol.join(","));
  if (filtros.sede?.length) params.set("sede", filtros.sede.join(","));
  if (filtros.facultad?.length) params.set("facultad", filtros.facultad.join(","));
  if (filtros.programaOArea?.length) params.set("area", filtros.programaOArea.join(","));
  return params.toString();
}

export function useFiltrosActivos() {
  const { rol, sede, facultad, programaOArea } = useFiltrosStore();
  return Boolean(rol?.length || sede?.length || facultad?.length || programaOArea?.length);
}

/**
 * Trae el resumen recalculado en el servidor para los filtros activos.
 * Si no hay filtros activos, no consulta (la página ya trae los agregados
 * pre-calculados por defecto vía Server Component).
 */
export function useResumenFiltrado() {
  const { rol, sede, facultad, programaOArea } = useFiltrosStore();
  const hayFiltros = Boolean(rol?.length || sede?.length || facultad?.length || programaOArea?.length);
  const qs = construirQueryString({ rol, sede, facultad, programaOArea });

  const query = useQuery<ResumenFiltrado>({
    queryKey: ["resumen-filtrado", qs],
    queryFn: async () => {
      const res = await fetch(`/api/filtros?${qs}`);
      if (!res.ok) throw new Error("No se pudo cargar el resumen filtrado");
      return res.json();
    },
    enabled: hayFiltros,
    placeholderData: (prev) => prev,
  });

  return { ...query, hayFiltros };
}
