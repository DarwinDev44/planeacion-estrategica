/**
 * Crea (si no existe) la tabla de métricas de uso.
 *
 * Es AGREGADA a propósito: una fila por sección y día, con contadores que se
 * suman. No hay un registro por visita ni por clic, así que la tabla no crece
 * con el tráfico —unas 3.600 filas al año con 10 secciones— y no guarda nada
 * de quien navega: ni IP, ni identificador, ni recorrido.
 *
 * Se ejecuta a mano (`pnpm migrar:metricas`) y es idempotente.
 */
import { conexionSql } from "@/repositories/datasource/infrastructure/neon";
import { cargarEntorno } from "./entorno";

async function main() {
  cargarEntorno();
  const sql = conexionSql({ directa: true });

  await sql`
    create table if not exists metricas_uso (
      seccion text not null,
      dia date not null,
      visitas integer not null default 0,
      sesiones integer not null default 0,
      clics integer not null default 0,
      primary key (seccion, dia)
    )
  `;

  // El tablero consulta por rango de fechas ("últimos 30 días"), así que el
  // índice cubre ese acceso; la clave primaria ya cubre el upsert por fila.
  await sql`create index if not exists metricas_uso_dia_idx on metricas_uso (dia)`;

  const columnas = await sql`
    select column_name, data_type from information_schema.columns
    where table_schema = 'public' and table_name = 'metricas_uso'
    order by ordinal_position
  `;
  console.log("metricas_uso:");
  for (const c of columnas) console.log(`  · ${c.column_name} (${c.data_type})`);

  const filas = await sql`select count(*)::int as n from metricas_uso`;
  console.log(`\nfilas actuales: ${filas[0].n}`);
}

main().catch((error) => {
  console.error("Falló la migración:", error);
  process.exit(1);
});
