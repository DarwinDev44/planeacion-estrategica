import "server-only";
import type { MetricasUso } from "@/types/metricas";
import type { MetricasDataSource } from "./types";
import { conexionSql } from "./infrastructure/neon";
import { acumular, consultarMetricas } from "./metricas-almacen";

/**
 * Métricas de uso del portal, en Postgres (Neon).
 *
 * No podían salir de un Excel como el resto de módulos: se escriben desde el
 * propio sitio en cada visita, y en un entorno serverless el disco es de solo
 * lectura. Es el mismo motivo por el que el Momento 4 vive en la base.
 */
export class PostgresMetricasDataSource implements MetricasDataSource {
  registrar(
    seccion: string,
    incrementos: { visitas?: number; sesiones?: number; clics?: number }
  ): Promise<void> {
    return acumular(conexionSql(), seccion, incrementos);
  }

  getMetricas(dias: number): Promise<MetricasUso> {
    return consultarMetricas(conexionSql(), dias);
  }
}
