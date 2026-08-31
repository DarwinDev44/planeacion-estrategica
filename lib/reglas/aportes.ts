/**
 * Formato exigido al Excel del formulario general del Plan. Vive en
 * `lib/reglas/` por lo mismo que `momento4.ts`: lo necesitan a la vez el
 * servidor que rechaza un archivo y la vista que anuncia qué se espera.
 *
 * Es OTRO cuestionario, no otra tanda del de las transformaciones: comparte
 * las 17 primeras columnas y cambia las tres preguntas sobre la
 * transformación —cuál es, si responde a lo que se necesita y qué ajustaría—
 * por una sola pregunta abierta.
 */
import { COLUMNAS_MOMENTO4, normalizar } from "./momento4";

export const TITULO_APORTES =
  'Experiencia: "Transformaciones que nos conectan". (UCUNDINAMARCA)';

/** La pregunta abierta, y el único dato propio de este formulario. */
export const COLUMNA_APORTE = "Comparte aquí tu aporte:";

/**
 * Las 20 columnas del export, en orden.
 *
 * Las 17 primeras se toman de `COLUMNAS_MOMENTO4` en vez de repetirlas: son
 * literalmente las mismas —hasta "Comentarios: Unidad Regional"— y copiarlas
 * dejaría dos listas que habría que corregir a la vez cuando el formulario
 * cambie, como ya pasó al agregarse la pregunta del programa del graduado.
 */
export const COLUMNAS_APORTES: readonly string[] = [
  ...COLUMNAS_MOMENTO4.slice(0, 17),
  COLUMNA_APORTE,
  `Puntos: ${COLUMNA_APORTE}`,
  `Comentarios: ${COLUMNA_APORTE}`,
];

/**
 * Compara los encabezados contra el formato y describe la primera diferencia.
 * Devuelve null cuando el archivo cumple.
 *
 * Se distingue el caso de haber confundido los dos cuestionarios porque es el
 * error probable: comparten casi todas las columnas y solo se separan al
 * final, así que decir "faltan 3 columnas" mandaría a revisar el Excel a quien
 * en realidad se equivocó de casilla.
 */
export function validarColumnasAportes(encabezados: string[]): string | null {
  const recibidas = encabezados.map((e) => normalizar(e)).filter((c) => c.length > 0);
  const esperadas = COLUMNAS_APORTES.map(normalizar);

  if (!esperadas.some((columna) => recibidas.includes(columna))) {
    return "Ninguna de sus columnas coincide con este formulario: parece ser otro archivo. Debe ser el .xlsx exportado de Microsoft Forms.";
  }

  if (!recibidas.includes(normalizar(COLUMNA_APORTE))) {
    return recibidas.includes(normalizar("Transformación"))
      ? `Este archivo es el de una transformación, no el del formulario general: trae la columna "Transformación" y no "${COLUMNA_APORTE}". Súbelo en la casilla de su transformación, dentro del cargue del Momento 4.`
      : `Falta la columna "${COLUMNA_APORTE}", que es la pregunta de este formulario.`;
  }

  const faltantes = COLUMNAS_APORTES.filter((_, i) => !recibidas.includes(esperadas[i]));
  if (faltantes.length > 0) {
    return `Faltan ${faltantes.length} de las ${COLUMNAS_APORTES.length} columnas del formato. La primera que falta es "${faltantes[0]}".`;
  }

  const sobrantes = recibidas.filter((c) => !esperadas.includes(c));
  if (sobrantes.length > 0) {
    return `El archivo trae ${sobrantes.length} columna(s) que no son del formato. La primera es "${sobrantes[0]}".`;
  }

  const desordenada = esperadas.findIndex((c, i) => recibidas[i] !== c);
  if (desordenada !== -1) {
    return `Las columnas están en otro orden: en la posición ${desordenada + 1} se esperaba "${COLUMNAS_APORTES[desordenada]}".`;
  }

  return null;
}
