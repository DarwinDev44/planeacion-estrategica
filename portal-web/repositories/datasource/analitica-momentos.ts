import "server-only";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { leerPrimeraHoja, excelSerialToISO } from "./excel-utils";

export interface ArchivoAnaliticaMomentos {
  archivo: string;
  slug: string;
  titulo: string;
}

export type TipoAnaliticaMomento = "roster" | "encuesta" | "foro";

export interface OpcionValoracion {
  valor: string;
  valorNumerico: number;
  cantidad: number;
  porcentaje: number;
}

export interface PreguntaValoracion {
  pregunta: string;
  distribucion: OpcionValoracion[];
}

export interface PreguntaAbierta {
  pregunta: string;
  respuestas: string[];
}

export interface PublicacionForo {
  autor: string;
  sede: string | null;
  facultad: string | null;
  fecha: string | null;
  texto: string;
  esPublicacionOriginal: boolean;
}

export interface AnaliticaMomentoDetalle {
  archivo: string;
  titulo: string;
  tipo: TipoAnaliticaMomento;
  totalParticipantes: number;
  totalRespondieron: number;
  porcentajeRespondieron: number | null;
  preguntasValoracion: PreguntaValoracion[];
  preguntasAbiertas: PreguntaAbierta[];
  publicacionesForo: PublicacionForo[];
}

const DIRECTORIO_FUENTE = join(process.cwd(), "data", "source-analitica-momentos");
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

/**
 * Lista los .xlsx de "data/source-analitica-momentos" (copia desplegable de
 * la carpeta raíz "Analitica actividades momentos", mismo patrón que
 * source-metas) y deriva el título de cada card a partir del nombre de
 * archivo: se quita el prefijo numérico ("01_") y se cambian los "_" por
 * espacios.
 */
export function listarArchivosAnaliticaMomentos(): ArchivoAnaliticaMomentos[] {
  return readdirSync(DIRECTORIO_FUENTE)
    .filter((nombre) => nombre.toLowerCase().endsWith(".xlsx"))
    .sort((a, b) => a.localeCompare(b, "es"))
    .map((archivo) => {
      const titulo = tituloDesdeArchivo(archivo);
      return { archivo, slug: slugDesdeTitulo(titulo), titulo };
    });
}

export function obtenerAnaliticaMomento(archivo: string): AnaliticaMomentoDetalle {
  const filas = leerPrimeraHoja(join(DIRECTORIO_FUENTE, archivo));
  const encabezados = (filas[0] ?? []).map((h) => String(h ?? "").trim());
  const cuerpo = filas.slice(1);
  const titulo = tituloDesdeArchivo(archivo);

  if (encabezados.includes("respuesta_foro")) {
    return parsearForo(archivo, titulo, encabezados, cuerpo);
  }
  if (encabezados.some((h) => /^Q\d+_/.test(h))) {
    return parsearEncuesta(archivo, titulo, encabezados, cuerpo);
  }
  return parsearRoster(archivo, titulo, encabezados, cuerpo);
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
    porcentajeRespondieron: null,
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
  cuerpo: unknown[][]
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

  const totalParticipantes = contarParticipantesRoster();
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

/** Cuenta las filas válidas del archivo maestro (01) — universo fijo de participantes. */
function contarParticipantesRoster(): number {
  const filas = leerPrimeraHoja(join(DIRECTORIO_FUENTE, ARCHIVO_ROSTER));
  const encabezados = (filas[0] ?? []).map((h) => String(h ?? "").trim());
  const idxNombre = encabezados.indexOf("Nombre");
  return filas.slice(1).filter((fila) => fila[idxNombre] != null).length;
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
