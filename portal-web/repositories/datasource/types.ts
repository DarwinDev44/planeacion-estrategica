import type { Persona, RolAsignado, RespuestaPregunta } from "@/types/encuesta";
import type { FilaMeta } from "@/types/metas";

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
