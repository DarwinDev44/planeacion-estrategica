import "server-only";
import { ExcelEncuestaDataSource } from "./excel-data-source";
import type { EncuestaDataSource } from "./types";

export type { EncuestaDataSource } from "./types";

/**
 * Único punto de construcción del origen de datos. Para migrar a otra fuente
 * (SQL, API, etc.) en el futuro: escribir una clase que implemente
 * `EncuestaDataSource` y cambiar la instancia devuelta aquí — nada más en la
 * aplicación necesita saber que la fuente cambió.
 */
let instancia: EncuestaDataSource | null = null;

export function getEncuestaDataSource(): EncuestaDataSource {
  if (!instancia) instancia = new ExcelEncuestaDataSource();
  return instancia;
}
