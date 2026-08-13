/** Estado de una de las 5 casillas del Momento 4 (una por transformación). */
export interface DocumentoMomento4 {
  transformacion: string;
  etiqueta: string;
  /** Nombre del .xlsx presente en la carpeta; null si esa casilla está vacía. */
  archivo: string | null;
  /** Filas de respuesta del archivo (sin contar el encabezado). */
  respuestas: number;
  /** Fecha de modificación del archivo, en ISO. */
  actualizado: string | null;
}

/**
 * Una respuesta tal como la muestra la sección pública. Solo los campos que se
 * publican: el export trae además los campos de calificación de Microsoft
 * Forms, que no se guardan (ver momento4-formato.ts).
 */
export interface RespuestaMomento4 {
  id: number;
  /** Id de la casilla (uc-digital…), útil como clave de filtrado. */
  transformacion: string;
  /**
   * Nombre de la transformación (UC DIGITAL…). Sale de la casilla en la que se
   * cargó el documento y NO de la columna "Transformación" del Excel, que en
   * los archivos reales viene vacía o con otro valor.
   */
  etiqueta: string;
  correo: string | null;
  nombre: string | null;
  tipoActor: string | null;
  unidadRegional: string | null;
  /** ¿Consideran que esta transformación responde a lo que se necesita? */
  respondeNecesidad: string | null;
  /** ¿Qué ajustarían en esta transformación? */
  ajustes: string | null;
}

/** Qué pasó con un archivo concreto del cargue. */
export interface ResultadoCargue {
  archivo: string;
  aceptado: boolean;
  /** Por qué se aceptó o se rechazó, en texto para mostrar tal cual. */
  motivo: string;
  /** Casilla a la que iba dirigido, para mostrar el resultado en su fila. */
  transformacion: string | null;
  etiqueta: string | null;
  respuestas: number | null;
  /**
   * Filas que no se guardaron por traer un correo ya presente en el mismo
   * documento. Null cuando el cargue ni siquiera llegó a leerse.
   */
  descartadas: number | null;
  /** Filas que quedaron fuera por ser anteriores al corte de fecha. */
  descartadasPorFecha: number | null;
  /** Nombre del archivo al que sustituyó, cuando el cargue reemplazó a otro. */
  reemplazo: string | null;
}
