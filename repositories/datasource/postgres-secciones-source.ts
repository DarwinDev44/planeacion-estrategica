import "server-only";
import type { SeccionesDataSource } from "./types";
import { conexionSql } from "./infrastructure/neon";
import { consultarPublicada, fijarPublicada } from "./secciones-almacen";

/**
 * Estado de publicación de las secciones, en Postgres (Neon).
 *
 * Vive en la base y no en una constante del código porque quien lo cambia es
 * quien administra, desde el sitio publicado: una constante obligaría a un
 * despliegue para activar o desactivar una sección.
 */
export class PostgresSeccionesDataSource implements SeccionesDataSource {
  estaPublicada(seccion: string): Promise<boolean> {
    return consultarPublicada(conexionSql(), seccion);
  }

  publicar(seccion: string, publicada: boolean): Promise<boolean> {
    return fijarPublicada(conexionSql(), seccion, publicada);
  }
}
