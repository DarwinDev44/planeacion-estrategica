export interface FilaMeta {
  etiqueta: string;
  no: number;
  si: number;
  total: number;
  /** Porcentaje ya en escala 0-100 (p.ej. 73.21), listo para formatear. */
  porcentaje: number;
}

export type TablaMetaId =
  | "gca"
  | "administrativosContrato"
  | "administrativosSede"
  | "estudiantes"
  | "graduados";

export interface TablaMeta {
  id: TablaMetaId;
  titulo: string;
  subtitulo?: string;
  columnaEtiqueta: string;
  ordenColumnas: ["no", "si"] | ["si", "no"];
  filas: FilaMeta[];
}
