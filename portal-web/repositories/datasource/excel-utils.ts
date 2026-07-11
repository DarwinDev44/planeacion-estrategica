import "server-only";
import { readFileSync } from "node:fs";
import * as XLSX from "xlsx";

/**
 * Lee la primera hoja de un .xlsx como matriz de filas crudas. Se lee el
 * buffer explícitamente (en vez de XLSX.readFile) para evitar depender de
 * cómo el bundler del servidor (Turbopack/webpack) transforma el acceso a fs
 * interno de la librería.
 */
export function leerPrimeraHoja(ruta: string): unknown[][] {
  const buffer = readFileSync(ruta);
  const wb = XLSX.read(buffer, { type: "buffer" });
  const hoja = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json(hoja, { header: 1, raw: true, defval: null }) as unknown[][];
}

export function excelSerialToISO(serial: number): string {
  const EPOCH_MS = Date.UTC(1899, 11, 30);
  const ms = EPOCH_MS + Math.round(serial * 86400) * 1000;
  return new Date(ms).toISOString();
}
