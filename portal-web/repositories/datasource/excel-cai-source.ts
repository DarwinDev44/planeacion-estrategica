import "server-only";
import { statSync } from "node:fs";
import { join } from "node:path";
import type {
  Actividad,
  CaiData,
  EstadoActividad,
  ParticipanteEstado,
} from "@/types/cai";
import type { CaiDataSource, ParticipanteCai } from "./types";
import { leerLibro, hojaAMatriz } from "./excel-utils";

export const ARCHIVO_CAI = "Seguimiento participación actividades.xlsx";

/**
 * Lee "Seguimiento participación actividades.xlsx" — fuente autorizada del
 * módulo de seguimiento — y lo transforma en las entidades tipadas que usa la
 * aplicación. No hay JSON intermedio: cualquier cambio guardado en el .xlsx se
 * refleja en la siguiente consulta, sin ejecutar ningún script.
 *
 * Rendimiento: el resultado se cachea en memoria por proceso y solo se vuelve
 * a parsear cuando cambia la fecha de modificación del archivo
 * (`fs.statSync().mtimeMs`).
 */
export class ExcelCaiDataSource implements CaiDataSource {
  private readonly ruta: string;
  private cache: CaiData | null = null;
  private mtimeCache: number | null = null;

  constructor(directorioFuente = join(process.cwd(), "data", "source-cai")) {
    this.ruta = join(directorioFuente, ARCHIVO_CAI);
  }

  getCaiData(): CaiData {
    const mtime = statSync(this.ruta).mtimeMs;
    if (!this.cache || this.mtimeCache !== mtime) {
      this.cache = this.parsear();
      this.mtimeCache = mtime;
    }
    return this.cache;
  }

  /**
   * Padrón oficial de participantes (nombre + correo), tomado de la primera
   * actividad: todas las actividades listan a las mismas personas. Lo consume
   * el origen de Accesos para filtrar y nombrar sus registros.
   */
  getParticipantes(): ParticipanteCai[] {
    const primera = this.getCaiData().actividades[0];
    return (primera?.participantes ?? []).map(({ nombre, correo }) => ({ nombre, correo }));
  }

  private parsear(): CaiData {
    const filas = hojaAMatriz(leerLibro(this.ruta), "Hoja1", { raw: false, defval: "" });
    if (!filas) throw new Error(`El libro ${ARCHIVO_CAI} no contiene la hoja "Hoja1".`);

    const encabezados = (filas[0] ?? []).map((c) => String(c ?? "").trim());
    if (encabezados.length < 4) throw new Error("La hoja no tiene las columnas esperadas.");

    // Columnas de actividad: desde la col 3 hasta la última con encabezado.
    const columnas: ColumnaActividad[] = [];
    for (let i = 3; i < encabezados.length; i++) {
      if (!encabezados[i]) continue;
      columnas.push(parseEncabezado(encabezados[i], i));
    }

    // "Aceptación PAD" es el paso previo a las actividades y siempre va
    // primero, sin importar en qué columna quedó en el Excel de origen.
    const idxPad = columnas.findIndex((c) => c.id === "aceptacion-pad");
    if (idxPad > 0) {
      const [pad] = columnas.splice(idxPad, 1);
      columnas.unshift(pad);
    }

    const participantes: FilaParticipante[] = [];
    for (let f = 1; f < filas.length; f++) {
      const fila = filas[f] ?? [];
      const nombre = String(fila[0] ?? "").trim();
      if (!nombre) continue;

      const estados = columnas.map((col) => {
        const valor = String(fila[col.indice] ?? "").trim();
        if (valor !== "Finalizado" && valor !== "No finalizado") {
          throw new Error(
            `Valor inesperado en fila ${f + 1}, columna "${col.tituloCompleto}": "${valor}"`
          );
        }
        return valor as EstadoActividad;
      });

      participantes.push({ nombre, correo: String(fila[1] ?? "").trim(), estados });
    }

    const collator = new Intl.Collator("es", { sensitivity: "base" });

    const actividades: Actividad[] = columnas.map((col, idx) => {
      const lista: ParticipanteEstado[] = participantes.map((p) => ({
        nombre: p.nombre,
        correo: p.correo,
        estado: p.estados[idx],
      }));

      // Primero "No finalizado" (alfabético), luego "Finalizado" (alfabético).
      lista.sort((a, b) => {
        if (a.estado !== b.estado) return a.estado === "No finalizado" ? -1 : 1;
        return collator.compare(a.nombre, b.nombre);
      });

      const finalizados = lista.filter((p) => p.estado === "Finalizado").length;

      return {
        id: col.id,
        momento: col.momento,
        etiquetaMomento: col.etiquetaMomento,
        nombre: col.nombre,
        tituloCompleto: col.tituloCompleto,
        finalizados,
        noFinalizados: lista.length - finalizados,
        porcentajeFinalizacion: pct(finalizados, lista.length),
        participantes: lista,
      };
    });

    const totalRegistros = participantes.length * columnas.length;
    const totalFinalizados = actividades.reduce((s, a) => s + a.finalizados, 0);
    const momentosDistintos = new Set(
      columnas.map((c) => c.momento).filter((m): m is number => m !== null)
    );

    return {
      fuente: ARCHIVO_CAI,
      totalParticipantes: participantes.length,
      totalActividades: actividades.length,
      totalMomentos: momentosDistintos.size,
      avanceGeneral: pct(totalFinalizados, totalRegistros),
      totalRegistros,
      totalFinalizados,
      totalNoFinalizados: totalRegistros - totalFinalizados,
      participantesCompletos: participantes.filter((p) =>
        p.estados.every((e) => e === "Finalizado")
      ).length,
      actividades,
    };
  }
}

interface ColumnaActividad {
  indice: number;
  id: string;
  momento: number | null;
  etiquetaMomento: string;
  nombre: string;
  tituloCompleto: string;
}

interface FilaParticipante {
  nombre: string;
  correo: string;
  /** Paralelo a `columnas`. */
  estados: EstadoActividad[];
}

/** Redondea a 1 decimal. */
function pct(finalizados: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((finalizados / total) * 1000) / 10;
}

/** "2.2" → "2-2" */
function slugNumero(num: string): string {
  return num.replace(/\.+/g, "-").replace(/-+$/, "");
}

function parseEncabezado(titulo: string, indice: number): ColumnaActividad {
  const limpio = titulo.trim();

  if (/^aceptaci[oó]n\s+pad/i.test(limpio)) {
    return {
      indice,
      id: "aceptacion-pad",
      momento: null,
      etiquetaMomento: "Aceptación PAD",
      nombre: limpio, // "Aceptación PAD (Este es tu CAI)"
      tituloCompleto: limpio,
    };
  }

  // "Momento N actividad X[.Y] [(texto extra)] [: Nombre]"
  // Tolerante a texto adicional (p. ej. "(híbrido)") entre el número y los dos puntos.
  const m = limpio.match(/^Momento\s+(\d+)\s+actividad\s+([\d.]+)(?:[^:]*)?(?::\s*(.+))?$/i);
  if (!m) {
    throw new Error(`Encabezado de actividad no reconocido (col ${indice}): "${limpio}"`);
  }

  const momento = Number(m[1]);
  const numActividad = m[2].replace(/\.+$/, ""); // por si termina en "."

  return {
    indice,
    id: `m${momento}-a${slugNumero(numActividad)}`,
    momento,
    etiquetaMomento: `Momento ${momento}`,
    nombre: m[3]?.trim() || `Actividad ${numActividad}`,
    tituloCompleto: limpio,
  };
}
