import { readFileSync } from "node:fs";
import * as XLSX from "xlsx";

/**
 * Acceso de bajo nivel a los .xlsx: abrir un libro y volcar una hoja a filas.
 * Es la única puerta a la librería XLSX — que ningún origen la use por su
 * cuenta mantiene idénticas las opciones de lectura (`raw`, `defval`,
 * `cellDates`) en todo el proyecto, que es lo que hace que dos módulos
 * interpreten una misma celda de la misma forma.
 *
 * A diferencia del resto de esta carpeta no lleva "server-only": los scripts de
 * mantenimiento (`scripts/`) deben poder validar los Excel leyéndolos
 * exactamente como los lee el sitio, y ese guard —pensado para el bundle del
 * cliente— haría fallar su ejecución en Node. La protección real sigue en su
 * sitio: los orígenes que consumen este módulo sí declaran "server-only", que
 * es la capa que un componente podría importar por error.
 */

/**
 * Abre un .xlsx. Se lee el buffer explícitamente (en vez de XLSX.readFile)
 * para evitar depender de cómo el bundler del servidor (Turbopack/webpack)
 * transforma el acceso a fs interno de la librería.
 */
export function leerLibro(ruta: string, opciones: { cellDates?: boolean } = {}): XLSX.WorkBook {
  return XLSX.read(readFileSync(ruta), { type: "buffer", cellDates: opciones.cellDates ?? false });
}

/**
 * Convierte una hoja del libro en matriz de filas. Devuelve null si la hoja no
 * existe, para que quien la pida pueda decidir si es opcional o un error.
 */
export function hojaAMatriz(
  libro: XLSX.WorkBook,
  nombreHoja: string | null,
  opciones: { raw?: boolean; defval?: unknown } = {}
): unknown[][] | null {
  const nombre = nombreHoja ?? libro.SheetNames[0];
  const hoja = libro.Sheets[nombre];
  if (!hoja) return null;
  return XLSX.utils.sheet_to_json(hoja, {
    header: 1,
    raw: opciones.raw ?? true,
    defval: opciones.defval ?? null,
  }) as unknown[][];
}

/** Lee la primera hoja de un .xlsx como matriz de filas crudas. */
export function leerPrimeraHoja(ruta: string): unknown[][] {
  return hojaAMatriz(leerLibro(ruta), null) ?? [];
}

/**
 * Convierte el número de serie de fecha de Excel a ISO 8601. El epoch es el
 * 30/12/1899 (y no el 31/12) porque Excel arrastra a propósito el bug de 1900
 * como año bisiesto, por compatibilidad con Lotus 1-2-3.
 */
export function excelSerialToISO(serial: number): string {
  const EPOCH_MS = Date.UTC(1899, 11, 30);
  const ms = EPOCH_MS + Math.round(serial * 86400) * 1000;
  return new Date(ms).toISOString();
}
