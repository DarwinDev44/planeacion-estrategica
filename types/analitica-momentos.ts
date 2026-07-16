import type { PalabraFrecuencia } from "@/lib/frecuencia-palabras";

/**
 * Contrato de datos — Analítica actividades momentos.
 * Derivado en vivo de data/source-analitica-momentos/*.xlsx
 * (ver repositories/datasource/excel-analitica-momentos-source.ts).
 */

/** Cada .xlsx del directorio es una tarjeta de la galería. */
export interface ArchivoAnaliticaMomentos {
  archivo: string;
  slug: string;
  titulo: string;
}

/**
 * Forma del archivo, deducida de sus encabezados:
 *  - roster:   padrón maestro, una fila por persona y una columna por momento.
 *  - encuesta: una fila por persona que respondió (columnas "Q0N_…").
 *  - foro:     una fila por publicación (columna "respuesta_foro").
 */
export type TipoAnaliticaMomento = "roster" | "encuesta" | "foro";

export interface OpcionValoracion {
  valor: string;
  valorNumerico: number;
  cantidad: number;
  porcentaje: number;
}

export interface PreguntaValoracion {
  pregunta: string;
  distribucion: OpcionValoracion[];
}

export interface PreguntaAbierta {
  pregunta: string;
  respuestas: string[];
}

export interface PublicacionForo {
  autor: string;
  sede: string | null;
  facultad: string | null;
  fecha: string | null;
  texto: string;
  esPublicacionOriginal: boolean;
}

export interface AnaliticaMomentoDetalle {
  archivo: string;
  titulo: string;
  tipo: TipoAnaliticaMomento;
  totalParticipantes: number;
  totalRespondieron: number;
  porcentajeRespondieron: number | null;
  preguntasValoracion: PreguntaValoracion[];
  preguntasAbiertas: PreguntaAbierta[];
  publicacionesForo: PublicacionForo[];
}

// --- Resumen agregado de toda la sección (panel de la galería) ---

export interface ResumenActividad {
  slug: string;
  titulo: string;
  tituloCorto: string;
  respondieron: number;
  porcentaje: number | null;
  promedio: number | null;
  porcentajeAltas: number | null;
  aportes: number;
}

export interface ConversacionResumen {
  slug: string;
  tituloCorto: string;
  participantes: number;
  publicaciones: number;
}

export interface ResumenAnaliticaMomentos {
  universo: number;
  numActividades: number;
  promedioParticipacion: number | null;
  promedioValoracion: number | null;
  porcentajeSatisfaccion: number | null;
  totalAportes: number;
  actividades: ResumenActividad[];
  conversaciones: ConversacionResumen[];
  calificacionMomentos: { slug: string; tituloCorto: string; promedio: number | null } | null;
  /** Palabras más frecuentes en las respuestas abiertas de aprendizajes y mejoras (todas las actividades tipo "encuesta"). */
  palabrasFrecuentes: PalabraFrecuencia[];
  totalRespuestasAbiertas: number;
  /** Mismo cálculo, separado por tipo de pregunta abierta. */
  palabrasMejoras: PalabraFrecuencia[];
  totalRespuestasMejoras: number;
  palabrasAprendizaje: PalabraFrecuencia[];
  totalRespuestasAprendizaje: number;
  destacados: {
    mejorValorada: { slug: string; tituloCorto: string; promedio: number } | null;
    mayorParticipacion: { slug: string; tituloCorto: string; respondieron: number; porcentaje: number | null } | null;
    masAportes: { slug: string; tituloCorto: string; aportes: number } | null;
  };
}
