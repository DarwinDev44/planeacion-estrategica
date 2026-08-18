import "server-only";
import type {
  DocumentoParticipacion,
  RegistroParticipacion,
  ResultadoCargueParticipacion,
} from "@/types/participacion";
import { getParticipacionDataSource } from "./datasource";

/**
 * Única capa de acceso a las tandas de asistencia de Participación
 * ("Trabajo en territorio con la comunidad universitaria" - Participación).
 */
export function getDocumentosParticipacion(): Promise<DocumentoParticipacion[]> {
  return getParticipacionDataSource().getDocumentos();
}

/** Todos los registros de asistencia publicados, de todas las tandas cargadas. */
export function getRegistrosParticipacion(): Promise<RegistroParticipacion[]> {
  return getParticipacionDataSource().getRegistros();
}

/** Valida y guarda una tanda de asistencia nueva; se suma a las anteriores. */
export function guardarDocumentoParticipacion(
  nombreOriginal: string,
  contenido: Buffer
): Promise<ResultadoCargueParticipacion> {
  return getParticipacionDataSource().guardar(nombreOriginal, contenido);
}

/** Borra una tanda de asistencia, o todas si se pasa null. */
export function eliminarRegistrosParticipacion(documentoId: number | null): Promise<number> {
  return getParticipacionDataSource().eliminar(documentoId);
}
