import "server-only";
import { getSeccionesDataSource } from "./datasource";

/**
 * Única capa de acceso al estado de publicación de las secciones: si una
 * sección se muestra al público y el cambio de ese estado.
 */
export function estaSeccionPublicada(seccion: string): Promise<boolean> {
  return getSeccionesDataSource().estaPublicada(seccion);
}

/** Publica o retira una sección. Devuelve el estado que quedó guardado. */
export function publicarSeccion(seccion: string, publicada: boolean): Promise<boolean> {
  return getSeccionesDataSource().publicar(seccion, publicada);
}
