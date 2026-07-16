import "server-only";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import type {
  AnaliticaMomentoDetalle,
  ArchivoAnaliticaMomentos,
  OpcionValoracion,
  PreguntaAbierta,
  PreguntaValoracion,
  PublicacionForo,
  ResumenActividad,
  ResumenAnaliticaMomentos,
  ConversacionResumen,
} from "@/types/analitica-momentos";
import { calcularFrecuenciaPalabras } from "@/lib/frecuencia-palabras";
import type { AnaliticaMomentosDataSource } from "./types";
import { leerPrimeraHoja, excelSerialToISO } from "./infrastructure/excel";
import { CacheArchivo } from "./infrastructure/cache-archivo";

const ARCHIVO_ROSTER = "01_Valoracion_momentos_1_y_2.xlsx";

const COLUMNAS_ROSTER_IGNORADAS = new Set(["Nombre", "Apellido(s)", "Dirección de correo"]);

const COLUMNAS_ENCUESTA_IGNORADAS = new Set([
  "Respuesta",
  "Enviado el:",
  "Institución",
  "Departamento",
  "Curso",
  "Grupo",
  "ID",
  "Nombre completo",
  "Nombre de usuario",
  "Completado",
  "Dirección de correo",
  "Promedio",
]);

/** Todo lo que la sección deriva de los Excel, calculado en una sola pasada. */
interface EstadoAnalitica {
  archivos: ArchivoAnaliticaMomentos[];
  detallePorArchivo: Map<string, AnaliticaMomentoDetalle>;
  resumen: ResumenAnaliticaMomentos;
}

/**
 * Lee en vivo los .xlsx de "data/source-analitica-momentos" — fuente autorizada
 * de la sección — y deriva de cada uno su detalle, más el resumen agregado de
 * la galería. El título de cada tarjeta sale del nombre de archivo (se quita el
 * prefijo numérico y los "_" pasan a espacios), así que publicar una actividad
 * nueva es soltar un .xlsx en la carpeta: cero cambios de código.
 *
 * Rendimiento: todo el estado se calcula de una sola pasada y se cachea en
 * memoria, invalidado por la fecha de modificación de los archivos y por la
 * propia lista del directorio (ver CacheArchivo) — así agregar, quitar o editar
 * un Excel se refleja en la siguiente petición sin reiniciar nada.
 *
 * Una sola pasada importa aquí: el universo de participantes sale del archivo
 * roster y lo necesita cada actividad de tipo "encuesta". Antes se releía del
 * disco dentro del bucle, así que ese archivo se abría 7 veces por request y no
 * había caché alguna: los 8 Excel se reparseaban enteros en cada visita.
 */
export class ExcelAnaliticaMomentosDataSource implements AnaliticaMomentosDataSource {
  private readonly directorio: string;
  private readonly cache: CacheArchivo<EstadoAnalitica>;

  constructor(directorioFuente = join(process.cwd(), "data", "source-analitica-momentos")) {
    this.directorio = directorioFuente;
    this.cache = new CacheArchivo(
      // El propio directorio entra en la clave: su mtime cambia al agregar o
      // quitar un .xlsx, y con él la lista de rutas.
      () => [this.directorio, ...this.listarNombres().map((n) => join(this.directorio, n))],
      () => this.parsear()
    );
  }

  getArchivos(): ArchivoAnaliticaMomentos[] {
    return this.cache.obtener().archivos;
  }

  getDetalle(archivo: string): AnaliticaMomentoDetalle | null {
    return this.cache.obtener().detallePorArchivo.get(archivo) ?? null;
  }

  getResumen(): ResumenAnaliticaMomentos {
    return this.cache.obtener().resumen;
  }

  private listarNombres(): string[] {
    return readdirSync(this.directorio)
      .filter((nombre) => nombre.toLowerCase().endsWith(".xlsx"))
      .sort((a, b) => a.localeCompare(b, "es"));
  }

  private parsear(): EstadoAnalitica {
    const archivos: ArchivoAnaliticaMomentos[] = this.listarNombres().map((archivo) => {
      const titulo = tituloDesdeArchivo(archivo);
      return { archivo, slug: slugDesdeTitulo(titulo), titulo };
    });

    // El roster define el universo de participantes, que las actividades de
    // tipo "encuesta" usan como denominador: se parsea primero y su detalle
    // sirve tanto de tarjeta como de fuente del universo, sin releer el
    // archivo.
    const detalleRoster = this.parsearArchivo(ARCHIVO_ROSTER, tituloDesdeArchivo(ARCHIVO_ROSTER), 0);
    const universo = detalleRoster.totalParticipantes;

    const detallePorArchivo = new Map<string, AnaliticaMomentoDetalle>(
      archivos.map(({ archivo, titulo }) => [
        archivo,
        archivo === ARCHIVO_ROSTER ? detalleRoster : this.parsearArchivo(archivo, titulo, universo),
      ])
    );

    return {
      archivos,
      detallePorArchivo,
      resumen: construirResumen(archivos, detallePorArchivo, universo),
    };
  }

  /**
   * @param universo Denominador de participación; solo lo usan los archivos de
   *   tipo "encuesta". El roster lo ignora (él mismo define el universo), así
   *   que se le puede pasar 0 al parsearlo.
   */
  private parsearArchivo(
    archivo: string,
    titulo: string,
    universo: number
  ): AnaliticaMomentoDetalle {
    const filas = leerPrimeraHoja(join(this.directorio, archivo));
    const encabezados = (filas[0] ?? []).map((h) => String(h ?? "").trim());
    const cuerpo = filas.slice(1);

    if (encabezados.includes("respuesta_foro")) {
      return parsearForo(archivo, titulo, encabezados, cuerpo);
    }
    if (encabezados.some((h) => /^Q\d+_/.test(h))) {
      return parsearEncuesta(archivo, titulo, encabezados, cuerpo, universo);
    }
    return parsearRoster(archivo, titulo, encabezados, cuerpo);
  }
}

/**
 * Agrega todas las tarjetas de la sección en el resumen del panel de la
 * galería: métricas globales (participación, valoración, satisfacción,
 * aportes), comparativos por actividad, conversación (foro/reflexiones) y los
 * destacados.
 */
function construirResumen(
  archivos: ArchivoAnaliticaMomentos[],
  detallePorArchivo: Map<string, AnaliticaMomentoDetalle>,
  universo: number
): ResumenAnaliticaMomentos {
  const actividades: ResumenActividad[] = [];
  const conversaciones: ConversacionResumen[] = [];
  const textosMejoras: string[] = [];
  const textosAprendizaje: string[] = [];

  let sumaValores = 0;
  let sumaCantidades = 0;
  let sumaAltas = 0;

  for (const { slug, titulo, archivo } of archivos) {
    const detalle = detallePorArchivo.get(archivo);
    if (!detalle) continue;

    if (detalle.tipo === "encuesta" || detalle.tipo === "roster") {
      let sv = 0;
      let sc = 0;
      let sa = 0;
      for (const pregunta of detalle.preguntasValoracion) {
        for (const op of pregunta.distribucion) {
          sv += op.valorNumerico * op.cantidad;
          sc += op.cantidad;
          if (op.valorNumerico >= 4) sa += op.cantidad;
        }
      }
      for (const pregunta of detalle.preguntasAbiertas) {
        const tipo = clasificarPreguntaAbierta(pregunta.pregunta);
        if (tipo === "mejoras") textosMejoras.push(...pregunta.respuestas);
        else if (tipo === "aprendizaje") textosAprendizaje.push(...pregunta.respuestas);
      }
      const aportes = detalle.preguntasAbiertas.reduce((suma, p) => suma + p.respuestas.length, 0);
      actividades.push({
        slug,
        titulo,
        tituloCorto: tituloCortoActividad(titulo),
        respondieron: detalle.totalRespondieron,
        porcentaje: detalle.porcentajeRespondieron,
        promedio: sc > 0 ? sv / sc : null,
        porcentajeAltas: sc > 0 ? (sa / sc) * 100 : null,
        aportes,
      });
      sumaValores += sv;
      sumaCantidades += sc;
      sumaAltas += sa;
    } else if (detalle.tipo === "foro") {
      conversaciones.push({
        slug,
        tituloCorto: titulo,
        participantes: detalle.totalParticipantes,
        publicaciones: detalle.totalRespondieron,
      });
    }
  }

  const promedioParticipacion = actividades.length
    ? actividades.reduce((suma, a) => suma + (a.porcentaje ?? 0), 0) / actividades.length
    : null;

  const mejor = maxPor(actividades, (a) => a.promedio ?? -1);
  const participativa = maxPor(actividades, (a) => a.respondieron);
  const aportadora = maxPor(actividades, (a) => a.aportes);

  return {
    universo,
    numActividades: actividades.length,
    promedioParticipacion,
    promedioValoracion: sumaCantidades > 0 ? sumaValores / sumaCantidades : null,
    porcentajeSatisfaccion: sumaCantidades > 0 ? (sumaAltas / sumaCantidades) * 100 : null,
    totalAportes: actividades.reduce((suma, a) => suma + a.aportes, 0),
    actividades,
    conversaciones,
    calificacionMomentos: null,
    palabrasFrecuentes: calcularFrecuenciaPalabras([...textosMejoras, ...textosAprendizaje]),
    totalRespuestasAbiertas: textosMejoras.length + textosAprendizaje.length,
    palabrasMejoras: calcularFrecuenciaPalabras(textosMejoras, { maxPalabras: 15 }),
    totalRespuestasMejoras: textosMejoras.length,
    palabrasAprendizaje: calcularFrecuenciaPalabras(textosAprendizaje, { maxPalabras: 15 }),
    totalRespuestasAprendizaje: textosAprendizaje.length,
    destacados: {
      mejorValorada:
        mejor && mejor.promedio != null
          ? { slug: mejor.slug, tituloCorto: mejor.tituloCorto, promedio: mejor.promedio }
          : null,
      mayorParticipacion: participativa
        ? {
            slug: participativa.slug,
            tituloCorto: participativa.tituloCorto,
            respondieron: participativa.respondieron,
            porcentaje: participativa.porcentaje,
          }
        : null,
      masAportes:
        aportadora && aportadora.aportes > 0
          ? { slug: aportadora.slug, tituloCorto: aportadora.tituloCorto, aportes: aportadora.aportes }
          : null,
    },
  };
}

function maxPor<T>(items: T[], valor: (item: T) => number): T | null {
  if (items.length === 0) return null;
  return items.reduce((mejor, actual) => (valor(actual) > valor(mejor) ? actual : mejor));
}

/**
 * Clasifica una pregunta abierta como "mejoras" o "aprendizaje" por su
 * enunciado. Se revisa "mejora" primero porque la pregunta de la Actividad 1
 * ("¿Qué mejoras recomiendas debe tener el campo de aprendizaje...?")
 * contiene ambas palabras y es, en esencia, una pregunta de mejoras.
 */
function clasificarPreguntaAbierta(pregunta: string): "mejoras" | "aprendizaje" | null {
  const texto = pregunta.toLowerCase();
  if (texto.includes("mejora")) return "mejoras";
  if (texto.includes("aprendizaje")) return "aprendizaje";
  return null;
}

/**
 * "Valoracion actividad 3.1 y 3.2 momento 3" → "Momento 3 · Actividad 3.1 y 3.2".
 * "Valoracion momentos 1 y 2" → "Momentos 1 y 2" (ya se identifica sin prefijo).
 */
function tituloCortoActividad(titulo: string): string {
  const sinPrefijo = titulo.replace(/^Valoracion\s+/i, "").trim();
  const conMomento = sinPrefijo.match(/^(.*)\s+momento\s+3$/i);
  if (conMomento) {
    const resto = conMomento[1].trim();
    return `Momento 3 · ${resto.charAt(0).toUpperCase()}${resto.slice(1)}`;
  }
  return sinPrefijo.charAt(0).toUpperCase() + sinPrefijo.slice(1);
}

// ---------------------------------------------------------------------------
// Tipo "roster": el archivo maestro (01) con una fila por persona y una
// columna por momento valorado.
// ---------------------------------------------------------------------------
function parsearRoster(
  archivo: string,
  titulo: string,
  encabezados: string[],
  cuerpo: unknown[][]
): AnaliticaMomentoDetalle {
  const idxNombre = encabezados.indexOf("Nombre");
  const filasValidas = cuerpo.filter((fila) => fila[idxNombre] != null);

  const columnasValoracion = encabezados
    .map((h, i) => ({ pregunta: h, indice: i }))
    .filter(({ pregunta }) => pregunta && !COLUMNAS_ROSTER_IGNORADAS.has(pregunta));

  const preguntasValoracion = columnasValoracion.map(({ pregunta, indice }) =>
    construirDistribucion(
      pregunta,
      filasValidas.map((fila) => fila[indice])
    )
  );

  return {
    archivo,
    titulo,
    tipo: "roster",
    totalParticipantes: filasValidas.length,
    totalRespondieron: filasValidas.length,
    // El roster es el universo fijo de participantes: todos los listados
    // respondieron por construcción, así que el porcentaje siempre es 100%.
    porcentajeRespondieron: filasValidas.length > 0 ? 100 : null,
    preguntasValoracion,
    preguntasAbiertas: [],
    publicacionesForo: [],
  };
}

// ---------------------------------------------------------------------------
// Tipo "encuesta": una fila por persona que respondió una actividad
// (columnas "Q01_Valoración->pregunta" para escalas 1-5, "Q0N_pregunta" para
// texto abierto).
// ---------------------------------------------------------------------------
function parsearEncuesta(
  archivo: string,
  titulo: string,
  encabezados: string[],
  cuerpo: unknown[][],
  totalParticipantes: number
): AnaliticaMomentoDetalle {
  const idxId = encabezados.indexOf("ID");
  const filasValidas = cuerpo.filter((fila) => fila[idxId] != null);

  const columnasValoracion: { pregunta: string; indice: number }[] = [];
  const columnasAbiertas: { pregunta: string; indice: number }[] = [];

  encabezados.forEach((encabezado, indice) => {
    if (!encabezado || COLUMNAS_ENCUESTA_IGNORADAS.has(encabezado) || encabezado.startsWith("correo_match")) {
      return;
    }
    const matchValoracion = encabezado.match(/^Q\d+_Valoración->(.+)$/);
    if (matchValoracion) {
      columnasValoracion.push({ pregunta: matchValoracion[1].trim(), indice });
      return;
    }
    const matchAbierta = encabezado.match(/^Q\d+_(.+)$/);
    if (matchAbierta) {
      columnasAbiertas.push({ pregunta: matchAbierta[1].trim(), indice });
    }
  });

  const preguntasValoracion = columnasValoracion.map(({ pregunta, indice }) =>
    construirDistribucion(
      pregunta,
      filasValidas.map((fila) => fila[indice])
    )
  );

  const preguntasAbiertas: PreguntaAbierta[] = columnasAbiertas.map(({ pregunta, indice }) => ({
    pregunta,
    respuestas: filasValidas
      .map((fila) => fila[indice])
      .filter((v): v is string => typeof v === "string" && v.trim().length > 0),
  }));

  const totalRespondieron = filasValidas.length;

  return {
    archivo,
    titulo,
    tipo: "encuesta",
    totalParticipantes,
    totalRespondieron,
    porcentajeRespondieron: totalParticipantes > 0 ? (totalRespondieron / totalParticipantes) * 100 : null,
    preguntasValoracion,
    preguntasAbiertas,
    publicacionesForo: [],
  };
}

// ---------------------------------------------------------------------------
// Tipo "foro": una fila por publicación (post original o respuesta) en un
// foro de discusión.
// ---------------------------------------------------------------------------
function parsearForo(
  archivo: string,
  titulo: string,
  encabezados: string[],
  cuerpo: unknown[][]
): AnaliticaMomentoDetalle {
  const idx = (nombre: string) => encabezados.indexOf(nombre);
  const idxTexto = idx("respuesta_foro");
  const idxCorreo = idx("correo");
  const idxNombreCompleto = idx("nombre_completo");
  const idxSede = idx("sede");
  const idxFacultad = idx("facultad");
  const idxFecha = idx("fecha_respuesta");
  const idxPostPadre = idx("post_padre");

  const filasValidas = cuerpo.filter((fila) => fila[idxTexto] != null);

  const publicacionesForo: PublicacionForo[] = filasValidas
    .map((fila) => ({
      autor: String(fila[idxNombreCompleto] ?? "Anónimo"),
      sede: (fila[idxSede] as string | null) ?? null,
      facultad: (fila[idxFacultad] as string | null) ?? null,
      fecha: typeof fila[idxFecha] === "number" ? excelSerialToISO(fila[idxFecha] as number) : null,
      texto: String(fila[idxTexto]),
      esPublicacionOriginal: fila[idxPostPadre] == null,
    }))
    .sort((a, b) => (a.fecha ?? "").localeCompare(b.fecha ?? ""));

  const participantesUnicos = new Set(filasValidas.map((fila) => fila[idxCorreo])).size;

  return {
    archivo,
    titulo,
    tipo: "foro",
    totalParticipantes: participantesUnicos,
    totalRespondieron: filasValidas.length,
    porcentajeRespondieron: null,
    preguntasValoracion: [],
    preguntasAbiertas: [],
    publicacionesForo,
  };
}

function construirDistribucion(pregunta: string, valores: unknown[]): PreguntaValoracion {
  const numericos = valores
    .map((v) => numeroDesdeCelda(v))
    .filter((v): v is number => v != null);

  const conteos = new Map<number, number>();
  for (const valor of numericos) {
    conteos.set(valor, (conteos.get(valor) ?? 0) + 1);
  }

  const total = numericos.length;
  const distribucion: OpcionValoracion[] = [...conteos.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([valor, cantidad]) => ({
      valor: formatoValoracion.format(valor),
      valorNumerico: valor,
      cantidad,
      porcentaje: total > 0 ? (cantidad / total) * 100 : 0,
    }));

  return { pregunta, distribucion };
}

const formatoValoracion = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 2 });

function numeroDesdeCelda(valor: unknown): number | null {
  if (valor == null) return null;
  if (typeof valor === "number") return Number.isFinite(valor) ? valor : null;
  const numero = Number(String(valor).trim().replace(",", "."));
  return Number.isFinite(numero) ? numero : null;
}

function tituloDesdeArchivo(nombreArchivo: string): string {
  return nombreArchivo
    .replace(/\.xlsx$/i, "")
    .replace(/^\d+_/, "")
    .replace(/_/g, " ");
}

function slugDesdeTitulo(titulo: string): string {
  return titulo
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
