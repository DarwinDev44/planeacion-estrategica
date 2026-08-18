/**
 * Cada cargue es una tanda de asistencia (un evento en territorio) que se
 * SUMA a las anteriores — a diferencia del Momento 4, aquí no hay una casilla
 * fija por transformación: el objetivo es el seguimiento en el tiempo, así
 * que cada archivo nuevo agrega una tanda más en vez de reemplazar la
 * anterior.
 */
export interface DocumentoParticipacion {
  id: number;
  archivo: string;
  filas: number;
  cargadoEn: string;
}

/**
 * Una persona registrada en una tanda de asistencia. Solo los campos que se
 * publican — el resto de columnas que traiga el Excel se descarta al leerlo
 * (ver `lib/reglas/participacion.ts`) porque no son relevantes para el
 * seguimiento y sí pueden ser datos personales que no hace falta conservar.
 */
export interface RegistroParticipacion {
  id: number;
  documentoId: number;
  /** Fecha del evento de asistencia, en ISO (solo fecha, sin hora). */
  fechaInicio: string | null;
  nombreAsistente: string | null;
  edad: number | null;
  rol: string | null;
  codigoEstudiante: string | null;
  programaEstudiante: string | null;
  unidadEstudiante: string | null;
  coordinacionDocente: string | null;
  unidadDocente: string | null;
  facultadDocente: string | null;
  areaTrabajador: string | null;
  unidadTrabajador: string | null;
}

/** Qué pasó con un archivo concreto del cargue de participación. */
export interface ResultadoCargueParticipacion {
  archivo: string;
  aceptado: boolean;
  /** Por qué se aceptó o se rechazó, en texto para mostrar tal cual. */
  motivo: string;
  filas: number | null;
  /** De las columnas reconocidas del formato, cuántas trajo este archivo. */
  columnasReconocidas: number | null;
}
