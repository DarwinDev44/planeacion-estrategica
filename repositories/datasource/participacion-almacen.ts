import type { NeonQueryFunction } from "@neondatabase/serverless";
import type {
  DocumentoParticipacion,
  RegistroParticipacion,
  ResultadoCargueParticipacion,
} from "@/types/participacion";
import { CAMPOS_PARTICIPACION } from "@/lib/reglas/participacion";
import { leerParticipacion, interpretarFilaParticipacion } from "./participacion-formato";

/**
 * Lectura y escritura de las tandas de asistencia en Postgres.
 *
 * Sin "server-only" a propósito, igual que `momento4-almacen.ts`: el script
 * de migración necesita poder ejecutarse con Node directo.
 */

type Sql = NeonQueryFunction<false, false>;

const COLUMNAS = [
  "documento_id",
  "fecha_inicio",
  "nombre_asistente",
  "edad",
  "rol",
  "codigo_estudiante",
  "programa_estudiante",
  "unidad_estudiante",
  "coordinacion_docente",
  "unidad_docente",
  "facultad_docente",
  "area_trabajador",
  "unidad_trabajador",
] as const;

/** Filas por sentencia INSERT, con el mismo margen que el Momento 4 (ver ahí el porqué). */
const FILAS_POR_SENTENCIA = 1000;

/** Las tandas de asistencia cargadas, de la más reciente a la más antigua. */
export async function consultarDocumentos(sql: Sql): Promise<DocumentoParticipacion[]> {
  const filas = await sql`
    select id, archivo, filas, cargado_en
    from participacion_documentos
    order by cargado_en desc, id desc
  `;
  return filas.map((f) => ({
    id: Number(f.id),
    archivo: f.archivo as string,
    filas: Number(f.filas),
    cargadoEn: new Date(f.cargado_en as string).toISOString(),
  }));
}

/** Todos los registros de asistencia publicados, de todas las tandas. */
export async function consultarRegistros(sql: Sql): Promise<RegistroParticipacion[]> {
  const filas = await sql`
    select id, documento_id, fecha_inicio, nombre_asistente, edad, rol,
           codigo_estudiante, programa_estudiante, unidad_estudiante,
           coordinacion_docente, unidad_docente, facultad_docente,
           area_trabajador, unidad_trabajador
    from participacion_registros
    order by fecha_inicio nulls last, id
  `;
  return filas.map((f) => ({
    id: Number(f.id),
    documentoId: Number(f.documento_id),
    fechaInicio: aFechaISO(f.fecha_inicio),
    nombreAsistente: (f.nombre_asistente as string | null) ?? null,
    edad: f.edad === null ? null : Number(f.edad),
    rol: (f.rol as string | null) ?? null,
    codigoEstudiante: (f.codigo_estudiante as string | null) ?? null,
    programaEstudiante: (f.programa_estudiante as string | null) ?? null,
    unidadEstudiante: (f.unidad_estudiante as string | null) ?? null,
    coordinacionDocente: (f.coordinacion_docente as string | null) ?? null,
    unidadDocente: (f.unidad_docente as string | null) ?? null,
    facultadDocente: (f.facultad_docente as string | null) ?? null,
    areaTrabajador: (f.area_trabajador as string | null) ?? null,
    unidadTrabajador: (f.unidad_trabajador as string | null) ?? null,
  }));
}

/**
 * Una columna `date` a la cadena "aaaa-mm-dd" que declara el tipo de dominio.
 *
 * No basta con `String(valor)`: el driver devuelve un `Date` de JavaScript y
 * convertirlo así da "Sat Aug 15 2026 00:00:00 GMT-0500", que la vista no
 * puede volver a interpretar —`new Date("Sat Aug…T12:00:00")` es Invalid
 * Date— y deja la tabla y el gráfico sin fecha. Tampoco sirve `toISOString`:
 * ese Date es la medianoche LOCAL, así que en una zona al oeste de UTC la
 * parte de fecha en UTC cae en el día anterior y toda la serie se correría un
 * día. Por eso se leen los componentes locales.
 */
function aFechaISO(valor: unknown): string | null {
  if (valor === null || valor === undefined) return null;
  const fecha = valor instanceof Date ? valor : new Date(String(valor));
  if (Number.isNaN(fecha.getTime())) return null;
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return `${fecha.getFullYear()}-${mes}-${dia}`;
}

/**
 * Valida el Excel y, si trae al menos un campo reconocido, lo guarda como una
 * tanda nueva. A diferencia del Momento 4 no reemplaza nada: cada tanda se
 * SUMA a las anteriores, porque el objetivo es el seguimiento de la
 * participación a través de varios eventos, no el estado de una sola casilla.
 */
export async function guardarDocumento(
  sql: Sql,
  nombreOriginal: string,
  contenido: Buffer
): Promise<ResultadoCargueParticipacion> {
  const rechazo = (motivo: string): ResultadoCargueParticipacion => ({
    archivo: nombreOriginal,
    aceptado: false,
    motivo,
    filas: null,
    columnasReconocidas: null,
  });

  const lectura = leerParticipacion(nombreOriginal, contenido);
  if (!lectura.ok) return rechazo(lectura.motivo);

  const registros = lectura.filas.map(interpretarFilaParticipacion);

  try {
    const [documento] = await sql`
      insert into participacion_documentos (archivo, filas, cargado_en)
      values (${nombreOriginal}, ${registros.length}, now())
      returning id
    `;
    const documentoId = Number(documento.id);

    await sql.transaction((txn) =>
      sentenciasDeInsercion(registros, documentoId).map(({ texto, parametros }) =>
        txn.query(texto, parametros)
      )
    );

    return {
      archivo: nombreOriginal,
      aceptado: true,
      motivo: `Tanda cargada · ${registros.length} registro(s) guardados, con ${lectura.columnasReconocidas} de las ${CAMPOS_PARTICIPACION.length} columnas del formato reconocidas.`,
      filas: registros.length,
      columnasReconocidas: lectura.columnasReconocidas,
    };
  } catch (error) {
    return rechazo(
      `El archivo es válido, pero no se pudo guardar en la base de datos: ${error instanceof Error ? error.message : "error desconocido"}`
    );
  }
}

/**
 * Borra una tanda de asistencia, o todas si no se indica cuál. Se borran
 * FILAS, nunca tablas (ver el mismo criterio en `momento4-almacen.ts`).
 */
export async function eliminarRegistros(sql: Sql, documentoId: number | null): Promise<number> {
  if (documentoId !== null) {
    const [borrados] = await sql.transaction((txn) => [
      txn`delete from participacion_registros where documento_id = ${documentoId} returning id`,
      txn`delete from participacion_documentos where id = ${documentoId}`,
    ]);
    return borrados.length;
  }

  const [borrados] = await sql.transaction((txn) => [
    txn`delete from participacion_registros returning id`,
    txn`delete from participacion_documentos returning id`,
  ]);
  return borrados.length;
}

/** Parte los registros en sentencias INSERT de a `FILAS_POR_SENTENCIA`. */
function sentenciasDeInsercion(
  registros: ReturnType<typeof interpretarFilaParticipacion>[],
  documentoId: number
): { texto: string; parametros: unknown[] }[] {
  const sentencias: { texto: string; parametros: unknown[] }[] = [];

  for (let inicio = 0; inicio < registros.length; inicio += FILAS_POR_SENTENCIA) {
    const lote = registros.slice(inicio, inicio + FILAS_POR_SENTENCIA);
    const parametros: unknown[] = [];
    const grupos = lote.map((registro) => {
      const valores = [
        documentoId,
        registro.fechaInicio,
        registro.nombreAsistente,
        registro.edad,
        registro.rol,
        registro.codigoEstudiante,
        registro.programaEstudiante,
        registro.unidadEstudiante,
        registro.coordinacionDocente,
        registro.unidadDocente,
        registro.facultadDocente,
        registro.areaTrabajador,
        registro.unidadTrabajador,
      ];
      const marcadores = valores.map((_, i) => `$${parametros.length + i + 1}`);
      parametros.push(...valores);
      return `(${marcadores.join(", ")})`;
    });
    sentencias.push({
      texto: `insert into participacion_registros (${COLUMNAS.join(", ")}) values ${grupos.join(", ")}`,
      parametros,
    });
  }

  return sentencias;
}
