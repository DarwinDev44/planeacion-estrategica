/**
 * Contrato de datos — Seguimiento participación actividades (CAI).
 * Derivado en vivo de data/source-cai/Seguimiento participación actividades.xlsx
 * (ver repositories/datasource/excel-cai-source.ts).
 */

export type EstadoActividad = "Finalizado" | "No finalizado";

export interface ParticipanteEstado {
  nombre: string;
  correo: string;
  estado: EstadoActividad;
}

export interface Actividad {
  /** Slug estable, ej. "m1-a1", "m3-a4-1", "aceptacion-pad" */
  id: string;
  /** Número de momento (1–3); null para "Aceptación PAD" */
  momento: number | null;
  /** Etiqueta corta del momento, ej. "Momento 1" o "Aceptación PAD" */
  etiquetaMomento: string;
  /** Nombre legible de la actividad, ej. "Diagnóstico" o "Actividad 4.1" */
  nombre: string;
  /** Encabezado original completo de la columna en el Excel */
  tituloCompleto: string;
  finalizados: number;
  noFinalizados: number;
  /** % de finalización (0–100, 1 decimal) */
  porcentajeFinalizacion: number;
  /** Todos los participantes con su estado en esta actividad */
  participantes: ParticipanteEstado[];
}

export interface CaiData {
  /** Nombre del archivo fuente */
  fuente: string;
  totalParticipantes: number;
  /** Número de actividades (incluye Aceptación PAD) */
  totalActividades: number;
  /** Momentos distintos (columnas "Momento N ...") */
  totalMomentos: number;
  /** % global: celdas "Finalizado" / total de celdas (0–100, 1 decimal) */
  avanceGeneral: number;
  /** Total de celdas persona×actividad */
  totalRegistros: number;
  totalFinalizados: number;
  totalNoFinalizados: number;
  /** Participantes que finalizaron TODAS las actividades */
  participantesCompletos: number;
  actividades: Actividad[];
}
