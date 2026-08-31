/**
 * Crea (si no existen) las tablas de los aportes generales al Plan en Neon.
 *
 * Se ejecuta a mano —`pnpm migrar:aportes`— y es idempotente, igual que las
 * demás migraciones.
 *
 * `aportes_documento` guarda una sola fila (id = 1) con el archivo vigente: a
 * diferencia de participación no hay tandas que acumular, porque el export de
 * Microsoft Forms ya trae todas las respuestas recibidas hasta la fecha y cada
 * cargue sustituye al anterior.
 */
import { conexionSql } from "@/repositories/datasource/infrastructure/neon";
import { cargarEntorno } from "./entorno";

async function main() {
  cargarEntorno();
  const sql = conexionSql({ directa: true });

  await sql`
    create table if not exists aportes_documento (
      id integer primary key default 1,
      archivo text not null,
      respuestas integer not null default 0,
      actualizado timestamptz not null default now(),
      constraint aportes_documento_unico check (id = 1)
    )
  `;

  await sql`
    create table if not exists aportes_respuestas (
      id bigserial primary key,
      respuesta_id text,
      fecha_inicio date,
      hora_inicio text,
      correo text,
      nombre text,
      tipo_actor text,
      unidad_regional text,
      aporte text not null,
      actualizado timestamptz not null default now()
    )
  `;

  // La sección ordena y filtra por día, y agrupa por rol y por unidad.
  await sql`create index if not exists aportes_respuestas_fecha_idx on aportes_respuestas (fecha_inicio)`;

  const columnas = await sql`
    select table_name, column_name, data_type
    from information_schema.columns
    where table_schema = 'public' and table_name like 'aportes_%'
    order by table_name, ordinal_position
  `;

  let tablaActual = "";
  for (const columna of columnas) {
    if (columna.table_name !== tablaActual) {
      tablaActual = columna.table_name as string;
      console.log(`\n${tablaActual}`);
    }
    console.log(`  · ${columna.column_name} (${columna.data_type})`);
  }
}

main().catch((error) => {
  console.error("Falló la migración:", error);
  process.exit(1);
});
