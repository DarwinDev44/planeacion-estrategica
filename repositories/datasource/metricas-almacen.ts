import type { NeonQueryFunction } from "@neondatabase/serverless";
import type { FilaMetrica, MetricasUso, ResumenSeccion } from "@/types/metricas";

/**
 * Métricas de uso en Postgres. Sin "server-only", igual que el resto de
 * almacenes: los scripts de mantenimiento deben poder leer por este mismo
 * camino y ese guard —pensado para el bundle del cliente— los haría fallar.
 */

type Sql = NeonQueryFunction<false, false>;

/**
 * Suma los contadores de una sección en el día de hoy.
 *
 * Es un UPSERT sobre una fila agregada, no una inserción por evento: la tabla
 * no crece con el tráfico y dos visitas simultáneas no se pisan, porque la
 * suma la hace Postgres sobre el valor guardado y no la aplicación sobre uno
 * que leyó antes.
 */
export async function acumular(
  sql: Sql,
  seccion: string,
  incrementos: { visitas?: number; sesiones?: number; clics?: number }
): Promise<void> {
  const visitas = Math.max(0, Math.trunc(incrementos.visitas ?? 0));
  const sesiones = Math.max(0, Math.trunc(incrementos.sesiones ?? 0));
  const clics = Math.max(0, Math.trunc(incrementos.clics ?? 0));
  if (visitas === 0 && sesiones === 0 && clics === 0) return;

  await sql`
    insert into metricas_uso (seccion, dia, visitas, sesiones, clics)
    values (${seccion}, current_date, ${visitas}, ${sesiones}, ${clics})
    on conflict (seccion, dia) do update
      set visitas = metricas_uso.visitas + excluded.visitas,
          sesiones = metricas_uso.sesiones + excluded.sesiones,
          clics = metricas_uso.clics + excluded.clics
  `;
}

/**
 * Todo lo que pinta el tablero, para un rango de días hacia atrás desde hoy.
 *
 * La serie diaria se rellena con ceros en los días sin actividad: si solo se
 * devolvieran los días con datos, el gráfico uniría dos fechas lejanas con una
 * línea recta y aparentaría un uso constante que no existió.
 */
export async function consultarMetricas(sql: Sql, dias: number): Promise<MetricasUso> {
  const ventana = Math.max(1, Math.trunc(dias));

  const filas = await sql`
    select seccion, to_char(dia, 'YYYY-MM-DD') as dia, visitas, sesiones, clics
    from metricas_uso
    where dia > current_date - ${ventana}::int
    order by dia, seccion
  `;

  const registros: FilaMetrica[] = filas.map((f) => ({
    seccion: f.seccion as string,
    dia: f.dia as string,
    visitas: Number(f.visitas),
    sesiones: Number(f.sesiones),
    clics: Number(f.clics),
  }));

  const porSeccion = new Map<string, ResumenSeccion>();
  const porDia = new Map<string, FilaMetrica>();
  let visitas = 0;
  let sesiones = 0;
  let clics = 0;

  for (const registro of registros) {
    visitas += registro.visitas;
    sesiones += registro.sesiones;
    clics += registro.clics;

    const seccion = porSeccion.get(registro.seccion) ?? {
      seccion: registro.seccion,
      visitas: 0,
      sesiones: 0,
      clics: 0,
    };
    seccion.visitas += registro.visitas;
    seccion.sesiones += registro.sesiones;
    seccion.clics += registro.clics;
    porSeccion.set(registro.seccion, seccion);

    const dia = porDia.get(registro.dia) ?? {
      seccion: "",
      dia: registro.dia,
      visitas: 0,
      sesiones: 0,
      clics: 0,
    };
    dia.visitas += registro.visitas;
    dia.sesiones += registro.sesiones;
    dia.clics += registro.clics;
    porDia.set(registro.dia, dia);
  }

  const hoy = new Date();
  const serie: FilaMetrica[] = [];
  for (let i = ventana - 1; i >= 0; i--) {
    const fecha = new Date(hoy);
    fecha.setDate(hoy.getDate() - i);
    const clave = fechaISO(fecha);
    serie.push(porDia.get(clave) ?? { seccion: "", dia: clave, visitas: 0, sesiones: 0, clics: 0 });
  }

  return {
    desde: serie[0]?.dia ?? fechaISO(hoy),
    hasta: serie[serie.length - 1]?.dia ?? fechaISO(hoy),
    visitas,
    sesiones,
    clics,
    clicsPorVisita: visitas > 0 ? clics / visitas : 0,
    porSeccion: [...porSeccion.values()].sort((a, b) => b.visitas - a.visitas),
    porDia: serie,
  };
}

/** Fecha local en YYYY-MM-DD, sin pasar por UTC (que correría el día). */
function fechaISO(fecha: Date): string {
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return `${fecha.getFullYear()}-${mes}-${dia}`;
}
