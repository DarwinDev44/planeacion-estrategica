import type { NeonQueryFunction } from "@neondatabase/serverless";

/**
 * Qué secciones están publicadas. Igual que `momento4-almacen.ts`, no lleva
 * "server-only": los scripts de mantenimiento deben poder leer y escribir por
 * este mismo camino, y ese guard —pensado para el bundle del cliente— los haría
 * fallar en Node.
 */

type Sql = NeonQueryFunction<false, false>;

/**
 * Si una sección está publicada. Ante la duda responde `false`: si la tabla no
 * existe todavía o la fila falta, es preferible que la sección quede oculta a
 * publicar por accidente datos que incluyen nombres y correos.
 */
export async function consultarPublicada(sql: Sql, seccion: string): Promise<boolean> {
  try {
    const filas = await sql`
      select publicada from secciones_publicadas where seccion = ${seccion}
    `;
    return filas[0]?.publicada === true;
  } catch {
    return false;
  }
}

/** Publica o retira una sección. Devuelve el estado que quedó guardado. */
export async function fijarPublicada(
  sql: Sql,
  seccion: string,
  publicada: boolean
): Promise<boolean> {
  const filas = await sql`
    insert into secciones_publicadas (seccion, publicada, actualizado)
    values (${seccion}, ${publicada}, now())
    on conflict (seccion) do update
      set publicada = excluded.publicada,
          actualizado = now()
    returning publicada
  `;
  return filas[0]?.publicada === true;
}
