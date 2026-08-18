/**
 * Añade lo que necesita la clasificación temática de comentarios: la columna
 * que guarda a qué grupo pertenece cada respuesta, y la tabla con el nombre y
 * los términos de cada grupo.
 *
 * Se ejecuta a mano (`pnpm migrar:clusters`) y es idempotente.
 *
 * Los grupos se recalculan enteros en cada cargue, así que la tabla se
 * reemplaza en vez de crecer: no hay histórico de clasificaciones, hay una
 * clasificación vigente que corresponde a los comentarios que hay ahora.
 */
import { conexionSql } from "@/repositories/datasource/infrastructure/neon";
import { cargarEntorno } from "./entorno";

async function main() {
  cargarEntorno();
  const sql = conexionSql({ directa: true });

  await sql`alter table momento4_respuestas add column if not exists cluster integer`;

  await sql`
    create table if not exists momento4_clusters (
      cluster integer primary key,
      nombre text not null,
      terminos text not null,
      total integer not null default 0,
      actualizado timestamptz not null default now()
    )
  `;

  const cols = await sql`
    select column_name from information_schema.columns
    where table_schema='public' and table_name='momento4_respuestas' and column_name='cluster'
  `;
  console.log(`columna cluster en momento4_respuestas: ${cols.length ? "sí" : "NO"}`);
  const t = await sql`
    select table_name from information_schema.tables
    where table_schema='public' order by table_name
  `;
  console.log("tablas:", t.map((x) => x.table_name).join(", "));
}

main().catch((e) => { console.error("Falló la migración:", e); process.exit(1); });
