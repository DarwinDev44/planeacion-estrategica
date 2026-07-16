import "server-only";
import { statSync } from "node:fs";
import { join } from "node:path";
import * as XLSX from "xlsx";
import type { AccesosCaiData, CorteAccesos } from "@/types/accesos-cai";
import type { AccesosCaiDataSource, CaiDataSource } from "./types";
import { leerLibro, hojaAMatriz } from "./excel-utils";

export const ARCHIVO_ACCESOS = "Accesos a CAI Planeación estratégica.xlsx";

/** Columnas de la hoja "Hoja1". */
const COL = { nombre: 0, correo: 1, dias: 4, fecha: 5 } as const;

/**
 * Lee "Accesos a CAI Planeación estratégica.xlsx" — fuente autorizada del
 * módulo de accesos — y arma los cortes por fecha que consume la vista.
 *
 * El padrón de personas (quién cuenta y con qué nombre se muestra) sale del
 * Excel de Seguimiento vía `CaiDataSource`: solo se reportan accesos de
 * participantes oficiales del CAI. Las reglas de saneamiento de correos viven
 * en la hoja "Reglas" del propio libro, no en el código.
 *
 * Rendimiento: caché en memoria por proceso, invalidada por la fecha de
 * modificación del archivo (`fs.statSync().mtimeMs`).
 */
export class ExcelAccesosCaiDataSource implements AccesosCaiDataSource {
  private readonly ruta: string;
  private cache: AccesosCaiData | null = null;
  private mtimeCache: number | null = null;

  constructor(
    private readonly cai: CaiDataSource,
    directorioFuente = join(process.cwd(), "data", "source-cai")
  ) {
    this.ruta = join(directorioFuente, ARCHIVO_ACCESOS);
  }

  getAccesosCaiData(): AccesosCaiData {
    const mtime = statSync(this.ruta).mtimeMs;
    if (!this.cache || this.mtimeCache !== mtime) {
      this.cache = this.parsear();
      this.mtimeCache = mtime;
    }
    return this.cache;
  }

  private parsear(): AccesosCaiData {
    const libro = leerLibro(this.ruta, { cellDates: true });

    const filas = hojaAMatriz(libro, "Hoja1");
    if (!filas) throw new Error(`El libro ${ARCHIVO_ACCESOS} no contiene la hoja "Hoja1".`);
    const reglas = leerReglas(libro);

    const nombreOficialPorCorreo = new Map(
      this.cai.getParticipantes().map((p) => [p.correo.trim().toLowerCase(), p.nombre])
    );

    const registros: RegistroAcceso[] = filas
      .slice(1)
      .map((fila) => {
        const nombre = limpiarTexto(fila[COL.nombre]);
        return {
          nombre,
          correo: reglas.corregirCorreo(limpiarTexto(fila[COL.correo]).toLowerCase(), nombre),
          dias: Number(fila[COL.dias]),
          fecha: fechaISO(fila[COL.fecha]),
        };
      })
      .filter(
        (registro) =>
          registro.nombre &&
          registro.correo &&
          !reglas.excluidos.has(registro.correo) &&
          nombreOficialPorCorreo.has(registro.correo) &&
          Number.isFinite(registro.dias) &&
          registro.fecha
      );

    // El Excel de accesos a veces trae el nombre más completo que el padrón.
    const nombrePorCorreo = new Map(nombreOficialPorCorreo);
    for (const registro of registros) {
      const actual = nombrePorCorreo.get(registro.correo) ?? "";
      const candidato = limpiarNombre(registro.nombre);
      if (candidato.length > actual.length) nombrePorCorreo.set(registro.correo, candidato);
    }

    const porFecha = new Map<string, RegistroAcceso[]>();
    for (const registro of registros) {
      const filasFecha = porFecha.get(registro.fecha) ?? [];
      filasFecha.push(registro);
      porFecha.set(registro.fecha, filasFecha);
    }

    const cortes = [...porFecha.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([fecha, filasFecha]) => {
        // Una persona puede tener varias filas en un mismo corte: vale la mayor.
        const porCorreo = new Map<string, RegistroAcceso>();
        for (const registro of filasFecha) {
          const actual = porCorreo.get(registro.correo);
          if (!actual || registro.dias > actual.dias) porCorreo.set(registro.correo, registro);
        }

        const personas = [...porCorreo.values()]
          .map((registro) => ({
            nombre: nombrePorCorreo.get(registro.correo) ?? registro.nombre,
            correo: registro.correo,
            dias: registro.dias,
          }))
          .sort((a, b) => b.dias - a.dias || a.nombre.localeCompare(b.nombre, "es"));

        return {
          fecha,
          personasUnicas: porCorreo.size,
          registros: filasFecha.length,
          // Se promedia sobre las personas ya deduplicadas —no sobre las filas
          // crudas— para que el promedio describa exactamente al mismo grupo
          // que `personasUnicas` y `rangos`. Un corte con filas repetidas (una
          // persona medida dos veces) daría si no un promedio de otra población.
          promedioDias: redondear(promedio(personas.map((persona) => persona.dias))),
          personas,
          rangos: [
            { etiqueta: "0–1 día", cantidad: personas.filter((p) => p.dias <= 1).length },
            {
              etiqueta: "2–3 días",
              cantidad: personas.filter((p) => p.dias >= 2 && p.dias <= 3).length,
            },
            {
              etiqueta: "4–7 días",
              cantidad: personas.filter((p) => p.dias >= 4 && p.dias <= 7).length,
            },
            { etiqueta: "8+ días", cantidad: personas.filter((p) => p.dias >= 8).length },
          ],
        };
      });

    return {
      fuente: ARCHIVO_ACCESOS,
      promedioGlobal: redondear(promedio(cortes.map((corte) => corte.promedioDias))),
      cortes: cortes.map((corte, indice): CorteAccesos => {
        const anterior = cortes[indice - 1]?.promedioDias;
        return {
          ...corte,
          variacionDias: anterior == null ? null : redondear(corte.promedioDias - anterior),
          variacionPorcentaje:
            anterior == null
              ? null
              : redondear(((corte.promedioDias - anterior) / anterior) * 100),
        };
      }),
    };
  }
}

interface RegistroAcceso {
  nombre: string;
  correo: string;
  dias: number;
  fecha: string;
}

interface ReglasCorreo {
  /** Correos que no entran al reporte. */
  excluidos: Set<string>;
  /** Aplica las correcciones de correos mal escritos en el origen. */
  corregirCorreo(correo: string, nombre: string): string;
}

/**
 * Hoja "Reglas": tipo | correo | reemplazo | contiene_nombre
 *  - excluido:   el correo no entra al reporte.
 *  - correccion: `correo` está mal escrito en el origen y vale `reemplazo`;
 *    si `contiene_nombre` trae texto, la corrección solo aplica a las filas
 *    cuyo nombre lo contenga (dos personas comparten el correo erróneo).
 */
function leerReglas(libro: XLSX.WorkBook): ReglasCorreo {
  const filas = hojaAMatriz(libro, "Reglas", { raw: false, defval: "" });
  if (!filas) throw new Error(`El libro ${ARCHIVO_ACCESOS} no contiene la hoja "Reglas".`);

  const excluidos = new Set<string>();
  const correcciones: Array<{ correo: string; reemplazo: string; contieneNombre: string }> = [];

  for (const fila of filas.slice(1)) {
    const tipo = limpiarTexto(fila[0]).toLowerCase();
    const correo = limpiarTexto(fila[1]).toLowerCase();
    if (!correo) continue;

    if (tipo === "excluido") {
      excluidos.add(correo);
      continue;
    }
    if (tipo === "correccion") {
      const reemplazo = limpiarTexto(fila[2]).toLowerCase();
      if (!reemplazo) throw new Error(`Regla "correccion" sin reemplazo para "${correo}".`);
      correcciones.push({ correo, reemplazo, contieneNombre: limpiarTexto(fila[3]).toUpperCase() });
      continue;
    }
    throw new Error(`Tipo de regla no reconocido en la hoja "Reglas": "${tipo}".`);
  }

  return {
    excluidos,
    corregirCorreo(correo, nombre) {
      const regla = correcciones.find(
        (r) =>
          r.correo === correo &&
          (!r.contieneNombre || nombre.toUpperCase().includes(r.contieneNombre))
      );
      return regla ? regla.reemplazo : correo;
    },
  };
}

function limpiarTexto(valor: unknown): string {
  return String(valor ?? "")
    .replace(/\u00a0/g, " ")
    .trim();
}

/**
 * Algunos nombres del origen llegan con el prefijo de dos letras repetido
 * ("AnAna María" → "Ana María"): se detecta porque la 1.ª y la 3.ª letra
 * coinciden y no hay espacio entre ellas.
 */
function limpiarNombre(nombre: string): string {
  const limpio = nombre.trim();
  const tienePrefijoDeIniciales =
    limpio.length > 3 && limpio[0] === limpio[2] && !limpio.slice(0, 3).includes(" ");
  return tienePrefijoDeIniciales ? limpio.slice(2).trim() : limpio;
}

function fechaISO(valor: unknown): string {
  if (valor instanceof Date && !Number.isNaN(valor.getTime())) {
    return valor.toISOString().slice(0, 10);
  }
  if (typeof valor === "number") {
    const fecha = XLSX.SSF.parse_date_code(valor);
    return fecha
      ? `${fecha.y}-${String(fecha.m).padStart(2, "0")}-${String(fecha.d).padStart(2, "0")}`
      : "";
  }
  const fecha = new Date(String(valor ?? ""));
  return Number.isNaN(fecha.getTime()) ? "" : fecha.toISOString().slice(0, 10);
}

function promedio(valores: number[]): number {
  return valores.length ? valores.reduce((total, valor) => total + valor, 0) / valores.length : 0;
}

function redondear(valor: number): number {
  return Math.round(valor * 100) / 100;
}
