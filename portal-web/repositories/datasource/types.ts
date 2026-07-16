import type { Persona, RolAsignado, RespuestaPregunta } from "@/types/encuesta";
import type { FilaMeta } from "@/types/metas";
import type { ConferenciaCard } from "@/types/conferencistas";
import type { ValoracionConferencista } from "@/types/valoraciones";
import type { CaiData } from "@/types/cai";
import type { AccesosCaiData } from "@/types/accesos-cai";

/**
 * Contrato que debe cumplir cualquier origen de datos de la encuesta.
 * `encuestaRepository.ts` depende únicamente de esta interfaz — nunca de
 * Excel, JSON, SQL o una API en concreto. Migrar a otra fuente en el futuro
 * (PostgreSQL, MySQL, SQL Server, una API REST, etc.) implica escribir una
 * nueva clase que la implemente y cambiar un único punto de construcción
 * (`getEncuestaDataSource` en `index.ts`); ningún componente de la interfaz
 * ni el resto del repositorio necesita cambiar.
 */
export interface EncuestaDataSource {
  getPersonas(): Persona[];
  getRolesAsignados(): RolAsignado[];
  getRespuestas(): RespuestaPregunta[];
}

/**
 * Contrato del origen de datos del módulo Metas. Cada método devuelve una de
 * las tablas ya agregadas (los .xlsx de origen son en sí mismos tablas
 * dinámicas exportadas, una fila por categoría) — igual que con la encuesta,
 * `metasRepository.ts` solo conoce esta interfaz.
 */
export interface MetasDataSource {
  getGestoresConocimiento(): FilaMeta[];
  getAdministrativosPorContrato(): FilaMeta[];
  getAdministrativosPorSede(): FilaMeta[];
  getCreadorOportunidad(): FilaMeta[];
  getGraduados(): FilaMeta[];
}

/**
 * Contrato del origen de datos del módulo Conferencistas. Una única hoja
 * ("Base de Datos" de Participación jornadas.xlsx) ya trae una fila por
 * tarjeta a publicar, con columnas *_card listas para presentar — no hace
 * falta agregación, solo tipar y filtrar por `publicar`.
 */
export interface ConferencistasDataSource {
  getConferencias(): ConferenciaCard[];
}

/**
 * Contrato del origen de datos de Valoraciones.xlsx. El mapeo hoja/columna ->
 * conferencista vive dentro de la implementación (ver
 * excel-valoraciones-source.ts); acá solo se expone la consulta por slug,
 * que devuelve null cuando no hay evidencia confiable para asociar una
 * valoración a esa persona (en vez de inventar una).
 */
export interface ValoracionesDataSource {
  getValoracion(slug: string): ValoracionConferencista | null;
}

/** Persona del padrón oficial del CAI. */
export interface ParticipanteCai {
  nombre: string;
  correo: string;
}

/**
 * Contrato del origen de datos del módulo Seguimiento
 * ("Seguimiento participación actividades.xlsx"). Una hoja con una fila por
 * participante y una columna por actividad; la implementación deriva de ahí
 * los totales y el % de finalización. `getParticipantes` expone el padrón
 * oficial, que `AccesosCaiDataSource` necesita para filtrar sus registros.
 */
export interface CaiDataSource {
  getCaiData(): CaiData;
  getParticipantes(): ParticipanteCai[];
}

/**
 * Contrato del origen de datos del módulo Accesos
 * ("Accesos a CAI Planeación estratégica.xlsx"). Depende del padrón del CAI:
 * solo se reportan accesos de participantes oficiales.
 */
export interface AccesosCaiDataSource {
  getAccesosCaiData(): AccesosCaiData;
}
