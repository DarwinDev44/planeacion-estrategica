import "server-only";
import { ExcelEncuestaDataSource } from "./excel-data-source";
import { ExcelMetasDataSource } from "./excel-metas-source";
import { ExcelConferencistasDataSource } from "./excel-conferencistas-source";
import { ExcelValoracionesDataSource } from "./excel-valoraciones-source";
import { ExcelCaiDataSource } from "./excel-cai-source";
import { ExcelAccesosCaiDataSource } from "./excel-accesos-source";
import { ExcelAnaliticaMomentosDataSource } from "./excel-analitica-momentos-source";
import { crearSingleton } from "./infrastructure/singleton";

export type {
  EncuestaDataSource,
  MetasDataSource,
  ConferencistasDataSource,
  ValoracionesDataSource,
  CaiDataSource,
  AccesosCaiDataSource,
  AnaliticaMomentosDataSource,
} from "./types";

/**
 * Único punto de construcción de los orígenes de datos: cada repositorio pide
 * el suyo aquí y solo conoce la interfaz que implementa, nunca la clase.
 *
 * Migrar un módulo a otra fuente (SQL, API REST, etc.) es escribir una clase
 * que cumpla el contrato correspondiente de `types.ts` y cambiar la línea de
 * abajo — ningún repositorio, página ni componente necesita enterarse.
 *
 * Son singletons porque la caché en memoria vive en la instancia: construir uno
 * nuevo en cada consulta tiraría la caché y reparsearía el Excel.
 */
export const getEncuestaDataSource = crearSingleton(() => new ExcelEncuestaDataSource());

export const getMetasDataSource = crearSingleton(() => new ExcelMetasDataSource());

export const getConferencistasDataSource = crearSingleton(() => new ExcelConferencistasDataSource());

export const getValoracionesDataSource = crearSingleton(() => new ExcelValoracionesDataSource());

export const getCaiDataSource = crearSingleton(() => new ExcelCaiDataSource());

// El padrón de Accesos sale del Excel de Seguimiento, no de una copia propia.
export const getAccesosCaiDataSource = crearSingleton(
  () => new ExcelAccesosCaiDataSource(getCaiDataSource())
);

export const getAnaliticaMomentosDataSource = crearSingleton(
  () => new ExcelAnaliticaMomentosDataSource()
);
