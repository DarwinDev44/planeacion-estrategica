import "server-only";
import type { CaiData } from "@/types/cai";
import { getCaiDataSource } from "./datasource";

/**
 * Única capa de acceso a los datos de seguimiento de participación
 * ("Seguimiento participación actividades.xlsx"). Devuelve el consolidado ya
 * agregado: totales, % de avance y una entrada por actividad con su lista de
 * participantes.
 */
export function getCaiData(): CaiData {
  return getCaiDataSource().getCaiData();
}
