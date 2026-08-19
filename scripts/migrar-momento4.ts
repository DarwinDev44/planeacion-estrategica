/**
 * Crea (si no existen) las tablas del Momento 4 en Neon.
 *
 * Se ejecuta a mano —`pnpm migrar:momento4`— y no al vuelo desde la aplicación:
 * lanzar un CREATE TABLE en cada petición gastaría un viaje a la base para algo
 * que cambia una vez. Es idempotente, así que volver a correrlo no rompe nada.
 *
 * Dos tablas y no una: el estado de cada casilla (qué archivo, cuántas
 * respuestas, cuándo se actualizó) se consulta en cada carga de /admin, y
 * derivarlo con un COUNT sobre todas las respuestas sería releer la tabla
 * grande solo para pintar cinco filas.
 */
import { conexionSql } from "@/repositories/datasource/infrastructure/neon";
import { cargarEntorno } from "./entorno";

async function main() {
  cargarEntorno();
  // Conexión directa (sin pooler): es lo recomendado para DDL y cargas
  // administrativas, donde pgbouncer no aporta y sí puede estorbar.
  const sql = conexionSql({ directa: true });

  await sql`
    create table if not exists momento4_documentos (
      transformacion text primary key,
      etiqueta text not null,
      archivo text not null,
      respuestas integer not null default 0,
      actualizado timestamptz not null default now()
    )
  `;

  await sql`
    create table if not exists momento4_respuestas (
      id bigserial primary key,
      transformacion text not null
        references momento4_documentos(transformacion) on delete cascade,
      respuesta_id text,
      hora_inicio text,
      hora_finalizacion text,
      correo text,
      nombre text,
      total_puntos text,
      comentarios_cuestionario text,
      hora_ultima_modificacion text,
      tipo_actor text,
      programa_graduado text,
      unidad_regional text,
      transformacion_declarada text,
      responde_necesidad text,
      ajustes text,
      actualizado timestamptz not null default now()
    )
  `;

  // La tabla ya existía sin esta columna cuando el formulario agregó la
  // pregunta "De que programa eres graduado", así que el CREATE de arriba no
  // basta: en una base ya creada no se ejecuta. Se agrega aparte para que la
  // migración sirva igual en una base nueva y en una que viene del formato
  // anterior.
  await sql`
    alter table momento4_respuestas add column if not exists programa_graduado text
  `;

  // Toda consulta de respuestas filtra por transformación (es la casilla a la
  // que pertenecen), así que el índice cubre el único acceso que existe.
  await sql`
    create index if not exists momento4_respuestas_transformacion_idx
      on momento4_respuestas (transformacion)
  `;

  const columnas = await sql`
    select table_name, column_name, data_type
    from information_schema.columns
    where table_schema = 'public' and table_name like 'momento4_%'
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
