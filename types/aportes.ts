/**
 * El formulario general del Plan ("Comparte aquí tu aporte"), que se responde
 * sin referirse a ninguna de las cinco transformaciones. Vive aparte del
 * Momento 4 porque es otro cuestionario: no pregunta a qué transformación se
 * refiere ni si esta responde a lo que se necesita, así que sus respuestas no
 * pueden alimentar el respaldo ni mezclarse en sus cifras.
 */

/** Estado del documento cargado; solo puede haber uno, el último que se subió. */
export interface DocumentoAportes {
  archivo: string;
  respuestas: number;
  /** Cuándo se cargó, en ISO. */
  actualizado: string;
}

/** Un aporte tal como lo muestra la sección. */
export interface RespuestaAporte {
  id: number;
  /** Día en que se respondió, en ISO ("aaaa-mm-dd"); null si no se pudo interpretar. */
  fechaInicio: string | null;
  correo: string | null;
  nombre: string | null;
  tipoActor: string | null;
  unidadRegional: string | null;
  /** El texto libre del formulario: es el dato por el que existe este módulo. */
  aporte: string;
}

/** Qué pasó con el archivo del cargue. */
export interface ResultadoCargueAportes {
  archivo: string;
  aceptado: boolean;
  /** Por qué se aceptó o se rechazó, en texto para mostrar tal cual. */
  motivo: string;
  respuestas: number | null;
  /** Filas que quedaron fuera por no traer ningún aporte escrito. */
  sinAporte: number | null;
  /** Filas que quedaron fuera por ser anteriores al corte de fecha. */
  descartadasPorFecha: number | null;
}
