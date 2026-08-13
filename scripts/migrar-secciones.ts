/**
 * Crea (si no existe) la tabla que decide qué secciones están publicadas, y
 * deja la del Momento 4 activada.
 *
 * Se ejecuta a mano —`pnpm migrar:secciones`— por el mismo motivo que la
 * migración del Momento 4: es un cambio que ocurre una vez, no en cada
 * petición. Es idempotente.
 *
 * La fila se inserta como visible para no cambiar el comportamiento actual al
 * desplegar: la sección ya estaba publicada. En el código, en cambio, la
 * ausencia de fila se interpreta como NO publicada — si la tabla faltara,
 * es preferible que la sección quede oculta a que se publiquen nombres y
 * correos sin querer.
 */
import { conexionSql } from "@/repositories/datasource/infrastructure/neon";
import { SECCION_TRANSFORMACIONES } from "@/constants/secciones";
import { cargarEntorno } from "./entorno";

async function main() {
  cargarEntorno();
  const sql = conexionSql({ directa: true });

  await sql`
    create table if not exists secciones_publicadas (
      seccion text primary key,
      publicada boolean not null default false,
      actualizado timestamptz not null default now()
    )
  `;

  await sql`
    insert into secciones_publicadas (seccion, publicada)
    values (${SECCION_TRANSFORMACIONES}, true)
    on conflict (seccion) do nothing
  `;

  const filas = await sql`
    select seccion, publicada, actualizado from secciones_publicadas order by seccion
  `;

  console.log("secciones_publicadas:");
  for (const fila of filas) {
    console.log(
      `  · ${fila.seccion}: ${fila.publicada ? "publicada" : "oculta"} (${new Date(
        fila.actualizado as string
      ).toLocaleString("es-CO")})`
    );
  }
}

main().catch((error) => {
  console.error("Falló la migración:", error);
  process.exit(1);
});
