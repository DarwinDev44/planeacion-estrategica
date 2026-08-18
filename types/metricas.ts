/** Contadores acumulados de una sección en un día. */
export interface FilaMetrica {
  /** Ruta de la sección, tal como aparece en la URL ("/metas"). */
  seccion: string;
  /** Día en formato ISO corto (YYYY-MM-DD). */
  dia: string;
  visitas: number;
  sesiones: number;
  clics: number;
}

/** Acumulado de una sección en todo el rango consultado. */
export interface ResumenSeccion {
  seccion: string;
  visitas: number;
  sesiones: number;
  clics: number;
}

/** Todo lo que necesita el tablero, en una sola consulta. */
export interface MetricasUso {
  /** Rango consultado, para poder rotularlo en pantalla. */
  desde: string;
  hasta: string;
  visitas: number;
  sesiones: number;
  clics: number;
  /** Clics por visita: 0 es ojear, varios es trabajar con la sección. */
  clicsPorVisita: number;
  /** Una entrada por sección, de más a menos visitada. */
  porSeccion: ResumenSeccion[];
  /** Una entrada por día del rango, incluidos los días sin actividad. */
  porDia: FilaMetrica[];
}

/** Los tres contadores que se pueden incrementar. */
export type TipoEvento = "visita" | "sesion" | "clic";
