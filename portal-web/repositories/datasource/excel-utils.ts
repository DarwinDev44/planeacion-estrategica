import "server-only";
import { readFileSync } from "node:fs";
import * as XLSX from "xlsx";

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

export function excelSerialToISO(serial: number): string {
  const EPOCH_MS = Date.UTC(1899, 11, 30);
  const ms = EPOCH_MS + Math.round(serial * 86400) * 1000;
  return new Date(ms).toISOString();
}
