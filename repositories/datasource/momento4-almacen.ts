import type { NeonQueryFunction } from "@neondatabase/serverless";
import type { DocumentoMomento4, RespuestaMomento4, ResultadoCargue } from "@/types/momento4";
import { FECHA_MINIMA_RESPUESTA, TRANSFORMACIONES_MOMENTO4 } from "@/lib/reglas/momento4";
import { leerDocumentoMomento4, type FilaExcelMomento4 } from "./momento4-formato";

/**
 * Lectura y escritura de los documentos del Momento 4 en Postgres.
 *
 * Igual que `infrastructure/excel.ts`, no lleva "server-only" a propósito: el
 * script de carga inicial (`scripts/cargar-momento4.ts`) tiene que escribir por
 * este mismo camino, y ese guard —pensado para el bundle del cliente— lo haría
 * fallar en Node. Cargar por otra vía podría meter en la base filas que la
 * aplicación no habría aceptado. La protección real sigue en su sitio: el
 * datasource y el repositorio que consumen esto sí declaran "server-only", y
 * son los que un componente podría importar por error.
 */

type Sql = NeonQueryFunction<false, false>;

/** Columnas de `momento4_respuestas`, emparejadas con el campo que las llena. */
const COLUMNAS: { sql: string; campo: keyof FilaExcelMomento4 }[] = [
  { sql: "respuesta_id", campo: "respuestaId" },
  { sql: "hora_inicio", campo: "horaInicio" },
  { sql: "hora_finalizacion", campo: "horaFinalizacion" },
  { sql: "correo", campo: "correo" },
  { sql: "nombre", campo: "nombre" },
  { sql: "total_puntos", campo: "totalPuntos" },
  { sql: "comentarios_cuestionario", campo: "comentariosCuestionario" },
  { sql: "hora_ultima_modificacion", campo: "horaUltimaModificacion" },
  { sql: "tipo_actor", campo: "tipoActor" },
  { sql: "unidad_regional", campo: "unidadRegional" },
  { sql: "transformacion_declarada", campo: "transformacionDeclarada" },
  { sql: "responde_necesidad", campo: "respondeNecesidad" },
  { sql: "ajustes", campo: "ajustes" },
];

/**
 * Filas por sentencia INSERT. Postgres admite como máximo 65.535 parámetros en
 * una sola sentencia, y aquí van 14 por fila: con un único INSERT, un documento
 * de más de ~4.680 respuestas fallaba entero ("Database request failed"). Se
 * reparte en lotes holgados por debajo de ese techo; todos viajan dentro de la
 * misma transacción, así que el reemplazo sigue siendo todo-o-nada.
 */
const FILAS_POR_SENTENCIA = 1000;

/** Estado de las 5 casillas: qué documento tiene cada una y de cuándo es. */
export async function consultarDocumentos(sql: Sql): Promise<DocumentoMomento4[]> {
  const filas = await sql`
    select transformacion, archivo, respuestas, actualizado
    from momento4_documentos
  `;

  const porTransformacion = new Map(filas.map((fila) => [fila.transformacion as string, fila]));

  // Se recorren las 5 transformaciones y no las filas de la tabla: las casillas
  // sin cargar deben aparecer igualmente, vacías.
  return TRANSFORMACIONES_MOMENTO4.map((t) => {
    const fila = porTransformacion.get(t.id);
    return {
      transformacion: t.id,
      etiqueta: t.etiqueta,
      archivo: (fila?.archivo as string) ?? null,
      respuestas: Number(fila?.respuestas ?? 0),
      actualizado: fila?.actualizado ? new Date(fila.actualizado as string).toISOString() : null,
    };
  });
}

/**
 * Todas las respuestas publicadas, con el nombre de su transformación. El orden
 * es estable (transformación y luego id) para que la tabla de la sección no
 * baraile filas entre recargas.
 */
export async function consultarRespuestas(sql: Sql): Promise<RespuestaMomento4[]> {
  const filas = await sql`
    select id, transformacion, correo, nombre, tipo_actor, unidad_regional,
           responde_necesidad, ajustes
    from momento4_respuestas
    order by transformacion, id
  `;

  const etiquetas = new Map(TRANSFORMACIONES_MOMENTO4.map((t) => [t.id as string, t.etiqueta]));

  return filas.map((fila) => ({
    id: Number(fila.id),
    transformacion: fila.transformacion as string,
    etiqueta: etiquetas.get(fila.transformacion as string) ?? (fila.transformacion as string),
    correo: (fila.correo as string | null) ?? null,
    nombre: (fila.nombre as string | null) ?? null,
    tipoActor: (fila.tipo_actor as string | null) ?? null,
    unidadRegional: (fila.unidad_regional as string | null) ?? null,
    respondeNecesidad: (fila.responde_necesidad as string | null) ?? null,
    ajustes: (fila.ajustes as string | null) ?? null,
  }));
}

/**
 * Borra los registros cargados: los de una transformación, o los de todas si
 * no se indica ninguna.
 *
 * Se borran FILAS, nunca tablas: nada de DROP ni TRUNCATE. La estructura debe
 * seguir en pie para que la siguiente carga funcione sin volver a migrar.
 *
 * Las dos tablas se vacían en una transacción para que no quede un documento
 * registrado sin sus respuestas —o al revés— si algo falla a medias.
 *
 * @returns Cuántas respuestas se eliminaron.
 */
export async function eliminarRegistros(
  sql: Sql,
  idTransformacion: string | null
): Promise<number> {
  if (idTransformacion) {
    const [borradas] = await sql.transaction((txn) => [
      txn`delete from momento4_respuestas where transformacion = ${idTransformacion} returning id`,
      txn`delete from momento4_documentos where transformacion = ${idTransformacion}`,
    ]);
    return borradas.length;
  }

  const [borradas] = await sql.transaction((txn) => [
    txn`delete from momento4_respuestas returning id`,
    txn`delete from momento4_documentos`,
  ]);
  return borradas.length;
}

/**
 * Valida el Excel y, si cumple el formato, reemplaza las respuestas de esa
 * transformación. Nunca lanza: el motivo del rechazo se muestra tal cual a
 * quien subió el documento.
 */
export async function guardarDocumento(
  sql: Sql,
  idTransformacion: string,
  nombreOriginal: string,
  contenido: Buffer
): Promise<ResultadoCargue> {
  const transformacion = TRANSFORMACIONES_MOMENTO4.find((t) => t.id === idTransformacion);

  const rechazo = (motivo: string): ResultadoCargue => ({
    archivo: nombreOriginal,
    aceptado: false,
    motivo,
    transformacion: transformacion?.id ?? null,
    etiqueta: transformacion?.etiqueta ?? null,
    respuestas: null,
    descartadas: null,
    descartadasPorFecha: null,
    reemplazo: null,
  });

  if (!transformacion) {
    return rechazo("No se indicó a qué transformación corresponde el documento.");
  }

  const lectura = leerDocumentoMomento4(nombreOriginal, contenido);
  if (!lectura.ok) return rechazo(lectura.motivo);

  try {
    // Qué había antes, para poder decir a qué documento sustituyó.
    const previo = await sql`
      select archivo from momento4_documentos where transformacion = ${transformacion.id}
    `;

    // Todo en una transacción: o queda el documento nuevo entero, o se queda el
    // anterior. Nunca una mezcla de los dos.
    await sql.transaction((txn) => [
      // El documento va primero: las respuestas lo referencian por clave
      // foránea, así que insertarlas antes fallaría en el primer cargue.
      txn`
        insert into momento4_documentos (transformacion, etiqueta, archivo, respuestas, actualizado)
        values (${transformacion.id}, ${transformacion.etiqueta}, ${nombreOriginal},
                ${lectura.respuestas.length}, now())
        on conflict (transformacion) do update
          set etiqueta = excluded.etiqueta,
              archivo = excluded.archivo,
              respuestas = excluded.respuestas,
              actualizado = now()
      `,
      // Reemplazo, no acumulación: se borran las respuestas anteriores de esta
      // transformación antes de insertar las nuevas.
      txn`delete from momento4_respuestas where transformacion = ${transformacion.id}`,
      ...sentenciasDeInsercion(lectura.respuestas, transformacion.id).map(({ texto, parametros }) =>
        txn.query(texto, parametros)
      ),
    ]);

    const anterior = (previo[0]?.archivo as string | undefined) ?? null;
    const corte = FECHA_MINIMA_RESPUESTA.toLocaleDateString("es-CO");
    const repetidas =
      lectura.descartadas > 0
        ? ` Se descartaron ${lectura.descartadas} por correo repetido dentro del archivo (se conservó la respuesta más reciente de cada persona).`
        : "";
    const anteriores =
      lectura.descartadasPorFecha > 0
        ? ` Quedaron fuera ${lectura.descartadasPorFecha} por ser anteriores al ${corte}.`
        : "";

    // Con cero guardadas, "0 respuesta(s) guardadas" suena a fallo cuando en
    // realidad el archivo se procesó bien: solo no traía nada nuevo.
    const resumen =
      lectura.respuestas.length === 0
        ? `Archivo aceptado en ${transformacion.etiqueta}, sin respuestas nuevas que guardar: las ${lectura.descartadasPorFecha} del archivo son anteriores al ${corte}.`
        : `Cargado en ${transformacion.etiqueta} · ${lectura.respuestas.length} respuesta(s) guardadas en la base de datos.${anteriores}${repetidas}`;

    return {
      archivo: nombreOriginal,
      aceptado: true,
      motivo: resumen,
      transformacion: transformacion.id,
      etiqueta: transformacion.etiqueta,
      respuestas: lectura.respuestas.length,
      descartadas: lectura.descartadas,
      descartadasPorFecha: lectura.descartadasPorFecha,
      reemplazo: anterior !== nombreOriginal ? anterior : null,
    };
  } catch (error) {
    return rechazo(
      `El archivo es válido, pero no se pudo guardar en la base de datos: ${error instanceof Error ? error.message : "error desconocido"}`
    );
  }
}

/** Parte las respuestas en sentencias INSERT de a `FILAS_POR_SENTENCIA`. */
function sentenciasDeInsercion(
  respuestas: FilaExcelMomento4[],
  idTransformacion: string
): { texto: string; parametros: unknown[] }[] {
  const columnas = ["transformacion", ...COLUMNAS.map((c) => c.sql)];
  const sentencias: { texto: string; parametros: unknown[] }[] = [];

  for (let inicio = 0; inicio < respuestas.length; inicio += FILAS_POR_SENTENCIA) {
    const lote = respuestas.slice(inicio, inicio + FILAS_POR_SENTENCIA);
    const parametros: unknown[] = [];
    const grupos = lote.map((respuesta) => {
      const marcadores = columnas.map((_, i) => `$${parametros.length + i + 1}`);
      parametros.push(idTransformacion, ...COLUMNAS.map((c) => respuesta[c.campo]));
      return `(${marcadores.join(", ")})`;
    });
    sentencias.push({
      texto: `insert into momento4_respuestas (${columnas.join(", ")}) values ${grupos.join(", ")}`,
      parametros,
    });
  }

  return sentencias;
}
