import "server-only";
import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import * as XLSX from "xlsx";
import type { ComentarioValoracion, DistribucionCalificacion, ValoracionConferencista } from "@/types/valoraciones";
import type { ValoracionesDataSource } from "./types";

/**
 * Valoraciones.xlsx trae un formulario de Microsoft Forms por hoja. Las 5
 * primeras hojas evalúan actividades institucionales genéricas del Momento 3
 * (Campo de Aprendizaje, diálogo territorial, Vicerrectoría Académica,
 * Director de CTI) que no mencionan a ningún conferencista — se excluyen a
 * propósito, no hay evidencia que las vincule a una persona.
 *
 * Las 5 hojas restantes sí corresponden a las conferencias: el propio
 * enunciado de cada pregunta "Q01_Valoración" nombra al conferencista o su
 * cargo (verificado además cruzando fecha de envío de respuestas contra la
 * fecha real de cada charla, y el orden de las hojas contra el orden
 * cronológico de las conferencias — las tres señales coinciden). Ese mapeo
 * hoja/columna -> conferencista es la única parte "codificada a mano" de
 * este archivo: los DATOS (calificaciones, comentarios) siempre se leen en
 * vivo del Excel, nunca se copian.
 *
 * Dos jornadas fueron compartidas por dos conferencistas en una sola
 * pregunta (Indira Sotelo/David Tesone, Leonardo Yunda/Edgar Rodríguez), y
 * en dos hojas más los comentarios de texto libre son una sola columna
 * compartida entre varias personas aunque la calificación numérica sí sea
 * individual (Algeless/Ricardo Moreno/Martha Duque; y Ana Lucía Chávez
 * comparte comentarios con el dúo UNAD). Se muestra esa información
 * etiquetada como conjunta en vez de omitirla u ocultarla.
 */
interface FuenteValoracion {
  hoja: string;
  /** Índices de columna con calificación 1-5; si hay varias se agrupan en una sola distribución. */
  columnasCalificacion: number[];
  columnasComentarios: number[];
  calificacionCompartidaCon?: string[];
  comentariosCompartidosCon?: string[];
}

const MAPEO: Record<string, FuenteValoracion> = {
  "olga-lucia-diaz-villamizar": {
    hoja: "Val actividad 4. Conferencia 1",
    columnasCalificacion: [3, 4, 5],
    columnasComentarios: [6, 7],
  },
  "algeless-milka-pereira-meireles-da-silva": {
    hoja: "Val actividad 4, confe 2, 3 y 4",
    columnasCalificacion: [3],
    columnasComentarios: [6, 7],
    comentariosCompartidosCon: ["Ricardo Moreno Patiño", "Martha Lucía Duque Ramírez"],
  },
  "ricardo-moreno-patino": {
    hoja: "Val actividad 4, confe 2, 3 y 4",
    columnasCalificacion: [4],
    columnasComentarios: [6, 7],
    comentariosCompartidosCon: ["Algeless Milka Pereira Meireles Da Silva", "Martha Lucía Duque Ramírez"],
  },
  "martha-lucia-duque-ramirez": {
    hoja: "Val actividad 4, confe 2, 3 y 4",
    columnasCalificacion: [5],
    columnasComentarios: [6, 7],
    comentariosCompartidosCon: ["Algeless Milka Pereira Meireles Da Silva", "Ricardo Moreno Patiño"],
  },
  "david-tesone": {
    hoja: "Val actividad 4. conferencia 5",
    columnasCalificacion: [3],
    columnasComentarios: [4],
    calificacionCompartidaCon: ["Indira Sotelo"],
    comentariosCompartidosCon: ["Indira Sotelo"],
  },
  "indira-sotelo": {
    hoja: "Val actividad 4. conferencia 5",
    columnasCalificacion: [3],
    columnasComentarios: [4],
    calificacionCompartidaCon: ["David Tesone"],
    comentariosCompartidosCon: ["David Tesone"],
  },
  "francisco-cajiao-restrepo": {
    hoja: "Val actividad 4. cconferencia 6",
    columnasCalificacion: [3],
    columnasComentarios: [4, 5],
  },
  "leonardo-yunda": {
    hoja: "Val actividad 4. confe 7 y 8",
    columnasCalificacion: [3],
    columnasComentarios: [5],
    calificacionCompartidaCon: ["Edgar Guillermo Rodríguez Díaz"],
    comentariosCompartidosCon: ["Edgar Guillermo Rodríguez Díaz", "Ana Lucía Chávez Correal"],
  },
  "edgar-guillermo-rodriguez-diaz": {
    hoja: "Val actividad 4. confe 7 y 8",
    columnasCalificacion: [3],
    columnasComentarios: [5],
    calificacionCompartidaCon: ["Leonardo Yunda"],
    comentariosCompartidosCon: ["Leonardo Yunda", "Ana Lucía Chávez Correal"],
  },
  "ana-lucia-chavez-correal": {
    hoja: "Val actividad 4. confe 7 y 8",
    columnasCalificacion: [4],
    columnasComentarios: [5],
    comentariosCompartidosCon: ["Leonardo Yunda", "Edgar Guillermo Rodríguez Díaz"],
  },
};

export class ExcelValoracionesDataSource implements ValoracionesDataSource {
  private readonly ruta: string;
  private cache: Map<string, ValoracionConferencista> | null = null;
  private mtimeCache: number | null = null;

  constructor(directorioFuente = join(process.cwd(), "data", "source-valoraciones")) {
    this.ruta = join(directorioFuente, "Valoraciones.xlsx");
  }

  getValoracion(slug: string): ValoracionConferencista | null {
    return this.datos().get(slug) ?? null;
  }

  private datos(): Map<string, ValoracionConferencista> {
    const mtime = statSync(this.ruta).mtimeMs;
    if (!this.cache || this.mtimeCache !== mtime) {
      this.cache = this.parsear();
      this.mtimeCache = mtime;
    }
    return this.cache;
  }

  private parsear(): Map<string, ValoracionConferencista> {
    const buffer = readFileSync(this.ruta);
    const wb = XLSX.read(buffer, { type: "buffer" });
    const resultado = new Map<string, ValoracionConferencista>();

    for (const [slug, fuente] of Object.entries(MAPEO)) {
      const valoracion = this.leerHoja(wb, fuente);
      if (valoracion) resultado.set(slug, valoracion);
    }

    return resultado;
  }

  private leerHoja(wb: XLSX.WorkBook, fuente: FuenteValoracion): ValoracionConferencista | null {
    const hoja = wb.Sheets[fuente.hoja];
    if (!hoja) return null;

    const filas = XLSX.utils.sheet_to_json(hoja, { header: 1, raw: true, defval: null }) as unknown[][];
    const datos = filas.slice(1).filter((f) => f && f[0]);

    const valores: number[] = [];
    for (const fila of datos) {
      for (const c of fuente.columnasCalificacion) {
        const v = Number(fila[c]);
        if (!Number.isNaN(v) && v >= 1 && v <= 5) valores.push(v);
      }
    }

    const distribucion: DistribucionCalificacion = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const v of valores) distribucion[v as 1 | 2 | 3 | 4 | 5]++;
    const promedio = valores.length > 0 ? valores.reduce((a, b) => a + b, 0) / valores.length : 0;

    const comentarios: ComentarioValoracion[] = [];
    for (const fila of datos) {
      const autor = String(fila[1] ?? "").trim();
      for (const c of fuente.columnasComentarios) {
        const texto = fila[c];
        if (typeof texto === "string" && texto.trim().length > 0) {
          comentarios.push({ autor, texto: texto.trim() });
        }
      }
    }

    return {
      totalRespuestas: Math.round(valores.length / fuente.columnasCalificacion.length),
      promedio: Math.round(promedio * 10) / 10,
      distribucion,
      calificacionCompartidaCon: fuente.calificacionCompartidaCon ?? [],
      comentarios,
      comentariosCompartidosCon: fuente.comentariosCompartidosCon ?? [],
    };
  }
}
