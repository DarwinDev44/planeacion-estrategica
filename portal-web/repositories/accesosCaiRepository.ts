import "server-only";
import type { AccesosCaiData } from "@/types/accesos-cai";
import { getAccesosCaiDataSource } from "./datasource";

/**
 * Única capa de acceso a los datos de accesos al CAI
 * ("Accesos a CAI Planeación estratégica.xlsx"). Devuelve los cortes por fecha
 * con sus personas, rangos de días y variación respecto al corte anterior.
 */
export function getAccesosCaiData(): AccesosCaiData {
  return getAccesosCaiDataSource().getAccesosCaiData();
}
