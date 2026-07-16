import "server-only";
import type {
  AnaliticaMomentoDetalle,
  ArchivoAnaliticaMomentos,
  ResumenAnaliticaMomentos,
} from "@/types/analitica-momentos";
import { getAnaliticaMomentosDataSource } from "./datasource";

/**
 * Única capa de acceso a datos de Analítica actividades momentos. Las páginas
 * consultan aquí y nunca leen el origen directamente — igual que el resto de
 * los módulos.
 */

/** Una entrada por .xlsx publicado en el directorio fuente, en orden de archivo. */
export function getArchivosAnaliticaMomentos(): ArchivoAnaliticaMomentos[] {
  return getAnaliticaMomentosDataSource().getArchivos();
}

/** Busca la tarjeta por su slug de URL; null si no existe. */
export function getArchivoAnaliticaMomentosPorSlug(slug: string): ArchivoAnaliticaMomentos | null {
  return getArchivosAnaliticaMomentos().find((item) => item.slug === slug) ?? null;
}

/** Detalle de una actividad; null si el archivo ya no está en el directorio. */
export function getDetalleAnaliticaMomento(archivo: string): AnaliticaMomentoDetalle | null {
  return getAnaliticaMomentosDataSource().getDetalle(archivo);
}

/** Resumen agregado de la sección (panel de la galería). */
export function getResumenAnaliticaMomentos(): ResumenAnaliticaMomentos {
  return getAnaliticaMomentosDataSource().getResumen();
}
