import "server-only";
import { ExcelEncuestaDataSource } from "./excel-data-source";
import { ExcelMetasDataSource } from "./excel-metas-source";
import { ExcelConferencistasDataSource } from "./excel-conferencistas-source";
import { ExcelValoracionesDataSource } from "./excel-valoraciones-source";
import { ExcelCaiDataSource } from "./excel-cai-source";
import { ExcelAccesosCaiDataSource } from "./excel-accesos-source";
import type {
  EncuestaDataSource,
  MetasDataSource,
  ConferencistasDataSource,
  ValoracionesDataSource,
  CaiDataSource,
  AccesosCaiDataSource,
} from "./types";

export type {
  EncuestaDataSource,
  MetasDataSource,
  ConferencistasDataSource,
  ValoracionesDataSource,
  CaiDataSource,
  AccesosCaiDataSource,
} from "./types";

/**
 * Único punto de construcción del origen de datos. Para migrar a otra fuente
 * (SQL, API, etc.) en el futuro: escribir una clase que implemente
 * `EncuestaDataSource` y cambiar la instancia devuelta aquí — nada más en la
 * aplicación necesita saber que la fuente cambió.
 */
let instancia: EncuestaDataSource | null = null;

export function getEncuestaDataSource(): EncuestaDataSource {
  if (!instancia) instancia = new ExcelEncuestaDataSource();
  return instancia;
}

let instanciaMetas: MetasDataSource | null = null;

export function getMetasDataSource(): MetasDataSource {
  if (!instanciaMetas) instanciaMetas = new ExcelMetasDataSource();
  return instanciaMetas;
}

let instanciaConferencistas: ConferencistasDataSource | null = null;

export function getConferencistasDataSource(): ConferencistasDataSource {
  if (!instanciaConferencistas) instanciaConferencistas = new ExcelConferencistasDataSource();
  return instanciaConferencistas;
}

let instanciaValoraciones: ValoracionesDataSource | null = null;

export function getValoracionesDataSource(): ValoracionesDataSource {
  if (!instanciaValoraciones) instanciaValoraciones = new ExcelValoracionesDataSource();
  return instanciaValoraciones;
}

let instanciaCai: CaiDataSource | null = null;

export function getCaiDataSource(): CaiDataSource {
  if (!instanciaCai) instanciaCai = new ExcelCaiDataSource();
  return instanciaCai;
}

let instanciaAccesosCai: AccesosCaiDataSource | null = null;

export function getAccesosCaiDataSource(): AccesosCaiDataSource {
  // El padrón de Accesos sale del Excel de Seguimiento, no de una copia propia.
  if (!instanciaAccesosCai) {
    instanciaAccesosCai = new ExcelAccesosCaiDataSource(getCaiDataSource());
  }
  return instanciaAccesosCai;
}
