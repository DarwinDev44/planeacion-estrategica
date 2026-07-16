import "server-only";
import type { ConferenciaCard } from "@/types/conferencistas";
import { getConferencistasDataSource } from "./datasource";

/**
 * Única capa de acceso a datos del módulo Conferencistas. Los componentes
 * nunca leen el datasource directamente — igual que en `encuestaRepository.ts`
 * y `metasRepository.ts`.
 */
export function getConferencias(): ConferenciaCard[] {
  return getConferencistasDataSource().getConferencias();
}
