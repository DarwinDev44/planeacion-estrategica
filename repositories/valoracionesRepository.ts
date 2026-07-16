import "server-only";
import type { ValoracionConferencista } from "@/types/valoraciones";
import { getValoracionesDataSource } from "./datasource";

/**
 * Única capa de acceso a datos de Valoraciones.xlsx. Devuelve null cuando el
 * conferencista no tiene una valoración identificable con confianza (los dos
 * "Grupo Estratégico" y cualquier persona futura sin evidencia de mapeo) —
 * la UI debe tratar null como "sin sección de valoraciones", nunca inventar
 * un cero o un promedio vacío.
 */
export function getValoracion(slug: string): ValoracionConferencista | null {
  return getValoracionesDataSource().getValoracion(slug);
}
