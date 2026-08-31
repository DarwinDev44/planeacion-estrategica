import {
  FECHA_MINIMA_RESPUESTA,
  detectarDiaPrimero,
  interpretarFechaExport,
  normalizar,
  quitarCorreosRepetidos,
} from "@/lib/reglas/momento4";
import { COLUMNA_APORTE, validarColumnasAportes } from "@/lib/reglas/aportes";
import { hojaAMatriz, leerLibroDesdeBuffer } from "./infrastructure/excel";

/**
 * Traducción del Excel del formulario general a filas tipadas. Vive aparte del
 * origen de datos por lo mismo que su equivalente del Momento 4: interpretar
 * el archivo es una cosa, y dónde termina guardado, otra.
 */

/** Una fila del Excel ya interpretada, con la fecha resuelta. */
export interface FilaExcelAporte {
  respuestaId: string | null;
  /** Día de la respuesta en ISO; null si la hora del export no se pudo leer. */
  fechaInicio: string | null;
  horaInicio: string | null;
  horaFinalizacion: string | null;
  correo: string | null;
  nombre: string | null;
  tipoActor: string | null;
  unidadRegional: string | null;
  aporte: string;
}

export type LecturaAportes =
  | {
      ok: true;
      respuestas: FilaExcelAporte[];
      /** Filas descartadas por no traer ningún aporte escrito. */
      sinAporte: number;
      /** Filas descartadas por ser anteriores al corte de fecha. */
      descartadasPorFecha: number;
      /** Filas descartadas por repetir correo y rol. */
      descartadas: number;
    }
  | { ok: false; motivo: string };

/** Columnas que se guardan. Las "Puntos:" y "Comentarios:" se exigen pero no se guardan. */
const CAMPOS = [
  { columna: "ID", campo: "respuestaId" },
  { columna: "Hora de inicio", campo: "horaInicio" },
  { columna: "Hora de finalización", campo: "horaFinalizacion" },
  { columna: "Correo electrónico", campo: "correo" },
  { columna: "Nombre", campo: "nombre" },
  { columna: "Tipo de actor", campo: "tipoActor" },
  { columna: "Unidad Regional", campo: "unidadRegional" },
] as const;

/**
 * Valida el archivo y devuelve sus aportes. No lanza: el motivo del rechazo se
 * le muestra tal cual a quien subió el documento.
 */
export function leerDocumentoAportes(nombreArchivo: string, contenido: Buffer): LecturaAportes {
  if (!nombreArchivo.toLowerCase().endsWith(".xlsx")) {
    return { ok: false, motivo: "No es un archivo .xlsx." };
  }
  if (contenido.byteLength === 0) {
    return { ok: false, motivo: "El archivo está vacío." };
  }

  let filas: unknown[][];
  try {
    filas = hojaAMatriz(leerLibroDesdeBuffer(contenido), null, { raw: false, defval: "" }) ?? [];
  } catch {
    return {
      ok: false,
      motivo: "No se pudo abrir como Excel: puede estar dañado o no ser un .xlsx real.",
    };
  }

  const encabezados = (filas[0] ?? []).map((celda) => String(celda ?? "").trim());
  if (encabezados.every((encabezado) => encabezado.length === 0)) {
    return {
      ok: false,
      motivo:
        "El archivo no se pudo leer como Excel: no tiene ninguna hoja con datos. Verifica que sea el .xlsx exportado de Microsoft Forms y no otro tipo de archivo renombrado.",
    };
  }

  const errorColumnas = validarColumnasAportes(encabezados);
  if (errorColumnas) {
    return { ok: false, motivo: `El formato no es compatible. ${errorColumnas}` };
  }

  const indice = new Map(encabezados.map((encabezado, i) => [normalizar(encabezado), i]));
  const columna = (fila: unknown[], nombre: string) =>
    texto(fila[indice.get(normalizar(nombre)) ?? -1]);

  const crudas = filas
    .slice(1)
    .filter((fila) => fila.some((celda) => String(celda ?? "").trim().length > 0))
    .map((fila) => {
      const respuesta = {} as FilaExcelAporte;
      for (const { columna: nombre, campo } of CAMPOS) {
        respuesta[campo] = columna(fila, nombre);
      }
      // Se guarda vacío por ahora; se descarta más abajo si no trae texto.
      respuesta.aporte = columna(fila, COLUMNA_APORTE) ?? "";
      respuesta.fechaInicio = null;
      return respuesta;
    });

  if (crudas.length === 0) {
    return {
      ok: false,
      motivo: "Tiene el formato correcto pero ninguna respuesta: solo trae los encabezados.",
    };
  }

  // El orden día/mes se decide con todas las fechas juntas, no fila por fila:
  // "5/8/26" es válido en los dos órdenes (ver detectarDiaPrimero).
  const diaPrimero = detectarDiaPrimero(crudas.flatMap((r) => [r.horaFinalizacion, r.horaInicio]));

  const conFecha = crudas.map((r) => {
    const fecha =
      interpretarFechaExport(r.horaFinalizacion, diaPrimero) ??
      interpretarFechaExport(r.horaInicio, diaPrimero);
    return { fila: r, fecha };
  });

  const enPlazo = conFecha.filter(({ fecha }) => fecha !== null && fecha >= FECHA_MINIMA_RESPUESTA);
  const descartadasPorFecha = conFecha.length - enPlazo.length;

  // Sin aporte escrito la fila no aporta nada a esta sección: el módulo existe
  // por ese texto, y una respuesta vacía solo inflaría el conteo.
  const conAporte = enPlazo.filter(({ fila }) => fila.aporte.trim().length > 0);
  const sinAporte = enPlazo.length - conAporte.length;

  const respuestas = conAporte.map(({ fila, fecha }) => ({
    ...fila,
    aporte: fila.aporte.trim(),
    fechaInicio: fecha ? soloFecha(fecha) : null,
  }));

  // Misma regla que el Momento 4: la identidad es correo + rol, y "anonymous"
  // no identifica a nadie, así que esas filas se conservan todas.
  const sinRepetidos = quitarCorreosRepetidos(
    respuestas,
    (r) => r.correo,
    (r) => r.tipoActor
  );

  return {
    ok: true,
    respuestas: sinRepetidos.unicas,
    sinAporte,
    descartadasPorFecha,
    descartadas: sinRepetidos.descartadas,
  };
}

/** La parte de fecha, con los componentes locales (ver el mismo criterio en participación). */
function soloFecha(fecha: Date): string {
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return `${fecha.getFullYear()}-${mes}-${dia}`;
}

/** Celda vacía y celda ausente son lo mismo: null, no la cadena "". */
function texto(celda: unknown): string | null {
  const valor = String(celda ?? "").trim();
  return valor.length > 0 ? valor : null;
}
