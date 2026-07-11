import type { Persona, RolAsignado, RespuestaPregunta } from "@/types/encuesta";

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
