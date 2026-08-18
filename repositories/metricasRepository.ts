import "server-only";
import type { MetricasUso } from "@/types/metricas";
import { getMetricasDataSource } from "./datasource";

/**
 * Única capa de acceso a las métricas de uso: el registro de actividad y su
 * lectura agregada para el tablero de administración.
 */
export function registrarUso(
  seccion: string,
  incrementos: { visitas?: number; sesiones?: number; clics?: number }
): Promise<void> {
  return getMetricasDataSource().registrar(seccion, incrementos);
}

/** Acumulados y serie diaria de los últimos `dias` días. */
export function getMetricasUso(dias: number): Promise<MetricasUso> {
  return getMetricasDataSource().getMetricas(dias);
}
