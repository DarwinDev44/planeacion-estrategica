/** Distribución de respuestas 1-5 para una pregunta de calificación. */
export type DistribucionCalificacion = Record<1 | 2 | 3 | 4 | 5, number>;

export interface ComentarioValoracion {
  autor: string;
  texto: string;
}

export interface ValoracionConferencista {
  totalRespuestas: number;
  promedio: number;
  distribucion: DistribucionCalificacion;
  /** Nombres de otros conferencistas que comparten esta misma pregunta de calificación (jornada conjunta), si aplica. */
  calificacionCompartidaCon: string[];
  comentarios: ComentarioValoracion[];
  /** Nombres de otros conferencistas cuyas respuestas también aparecen en estos comentarios (pregunta abierta compartida), si aplica. */
  comentariosCompartidosCon: string[];
}
