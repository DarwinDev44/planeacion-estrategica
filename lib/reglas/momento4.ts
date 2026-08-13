/**
 * Formato exigido a los documentos del Momento 4. Vive en `lib/reglas/` porque
 * lo necesitan a la vez el servidor (que rechaza un archivo que no lo cumpla) y
 * la vista de administración (que muestra al usuario qué se espera antes de
 * subir). Si el criterio viviera en las dos capas por separado, un cambio de
 * formato podría aceptar archivos que la pantalla dice que no acepta.
 */

export const TITULO_MOMENTO4 =
  'Trabajo en territorio con la comunidad universitaria: Experiencia "Transformaciones que nos conectan"';

/**
 * Las 5 transformaciones, una por documento.
 *
 * A qué transformación pertenece un archivo NO se deduce de su contenido ni de
 * su nombre: lo elige quien lo sube, subiendo de a un documento en su casilla.
 * Las dos alternativas se descartaron contra los archivos reales:
 *  · la columna "Transformación" del Excel no es fiable (el documento de UC
 *    PARA LA VIDA trae "UC Inteligente" en sus filas y el de UC DIGITAL la trae
 *    vacía);
 *  · el nombre del archivo varía entre exports, así que tampoco identifica nada
 *    de forma estable.
 */
export const TRANSFORMACIONES_MOMENTO4 = [
  { id: "uc-inteligente", etiqueta: "UC INTELIGENTE" },
  { id: "uc-translocal", etiqueta: "UC TRANSLOCAL" },
  { id: "uc-digital", etiqueta: "UC DIGITAL" },
  { id: "uc-emprendedora-e-innovadora", etiqueta: "UC EMPRENDEDORA E INNOVADORA" },
  { id: "uc-para-la-vida", etiqueta: "UC PARA LA VIDA" },
] as const;

export type TransformacionMomento4 = (typeof TRANSFORMACIONES_MOMENTO4)[number]["id"];

/**
 * Las 23 columnas del export de Microsoft Forms, en orden. Se exige
 * coincidencia exacta: es lo que garantiza que un archivo subido hoy se pueda
 * leer con el mismo código que los que ya están en la carpeta.
 */
export const COLUMNAS_MOMENTO4: readonly string[] = [
  "ID",
  "Hora de inicio",
  "Hora de finalización",
  "Correo electrónico",
  "Nombre",
  "Total de puntos",
  "Comentarios del cuestionario",
  "Hora de la última modificación",
  "Tipo de actor",
  "Puntos: Tipo de actor",
  "Comentarios: Tipo de actor",
  "Unidad Regional",
  "Puntos: Unidad Regional",
  "Comentarios: Unidad Regional",
  "Transformación",
  "Puntos: Transformación",
  "Comentarios: Transformación",
  "¿Consideran que esta transformación responde a lo que la UCundinamarca necesita del 2027 al 2037?",
  "Puntos: ¿Consideran que esta transformación responde a lo que la UCundinamarca necesita del 2027 al 2037?",
  "Comentarios: ¿Consideran que esta transformación responde a lo que la UCundinamarca necesita del 2027 al 2037?",
  "¿Qué ajustarían en esta transformación?",
  "Puntos: ¿Qué ajustarían en esta transformación?",
  "Comentarios: ¿Qué ajustarían en esta transformación?",
];

/**
 * Normaliza para comparar nombres y encabezados: sin tildes, en mayúsculas y
 * con los espacios colapsados. Así un archivo renombrado a minúsculas, o un
 * encabezado con doble espacio, no se rechaza por una diferencia cosmética.
 */
export function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Nombre con el que se guarda el documento de una transformación. Se renombra
 * al guardar porque el nombre de origen varía entre exports: con un nombre fijo
 * por casilla, la carpeta siempre dice sin ambigüedad qué documento es cuál.
 */
export function archivoCanonico(id: TransformacionMomento4): string {
  return `${id}.xlsx`;
}

/**
 * A qué transformación corresponde un archivo ya presente en la carpeta.
 * Primero por el nombre canónico; si no, se mira si el nombre menciona una sola
 * etiqueta, que es como vienen los exports originales
 * ("…(UC INTELIGENTE)(1-1).xlsx"). Ese segundo intento es lo que permite
 * reconocer los documentos que ya estaban antes de que existiera el cargue, sin
 * tener que renombrarlos a mano.
 */
export function transformacionDeArchivo(
  nombreArchivo: string
): (typeof TRANSFORMACIONES_MOMENTO4)[number] | null {
  const canonico = TRANSFORMACIONES_MOMENTO4.find(
    (t) => archivoCanonico(t.id).toLowerCase() === nombreArchivo.toLowerCase()
  );
  if (canonico) return canonico;

  const nombre = normalizar(nombreArchivo);
  const coincidencias = TRANSFORMACIONES_MOMENTO4.filter((t) =>
    nombre.includes(normalizar(t.etiqueta))
  );
  return coincidencias.length === 1 ? coincidencias[0] : null;
}

/**
 * Las tres opciones de "¿Consideran que esta transformación responde a lo que
 * la UCundinamarca necesita del 2027 al 2037?", en orden de mayor a menor
 * respaldo. El orden es el del gráfico y el de la leyenda: es una escala de
 * grado, no una lista de categorías sueltas, así que se pinta con la rampa
 * ordinal del proyecto (--valoracion-*) y no con la paleta categórica.
 */
export const OPCIONES_RESPALDO = [
  { id: "si", etiqueta: "Sí", color: "var(--valoracion-5)" },
  { id: "parcialmente", etiqueta: "Parcialmente", color: "var(--valoracion-3)" },
  { id: "no", etiqueta: "No", color: "var(--valoracion-1)" },
  // Cualquier otro texto cae aquí en vez de desaparecer del conteo: si un
  // export trae una opción nueva, se ve que existe en vez de perderse.
  { id: "otra", etiqueta: "Sin responder u otra", color: "var(--muted-foreground)" },
] as const;

export type OpcionRespaldo = (typeof OPCIONES_RESPALDO)[number]["id"];

/**
 * Clasifica el texto de esa respuesta. Se normaliza (sin tildes, en
 * mayúsculas) porque el mismo valor llega escrito de varias formas entre
 * exports —"Si", "SÍ", "sí"— y contarlos por separado partiría el gráfico en
 * categorías que son la misma.
 */
export function clasificarRespaldo(texto: string | null): OpcionRespaldo {
  const valor = normalizar(texto ?? "");
  if (valor === "SI") return "si";
  if (valor === "NO") return "no";
  if (valor === "PARCIALMENTE") return "parcialmente";
  return "otra";
}

/**
 * Deja una sola respuesta por correo DENTRO de un mismo documento: una persona
 * no puede figurar dos veces en el formulario de una transformación.
 *
 * El alcance es el documento y no el conjunto de los cinco a propósito. Las 5
 * transformaciones son formularios distintos y una misma persona puede opinar
 * sobre varias — de hecho ocurre en los documentos reales, donde el correo de
 * Estadística de Planeación aparece en cuatro de ellos. Deduplicar entre
 * documentos borraría respuestas legítimas.
 *
 * De cada correo repetido se conserva **la última** aparición: el export viene
 * ordenado por ID de respuesta ascendente, así que la última fila es la
 * respuesta más reciente de esa persona. Se prefiere ese criterio a leer la
 * columna de fecha porque el export la trae como texto en formato ambiguo
 * (`8/13/26 9:33`), y una fecha mal interpretada elegiría la respuesta
 * equivocada sin que nadie lo note.
 *
 * Las filas sin correo se conservan todas: un export puede traer respuestas
 * anónimas, y tratarlas como repetidas entre sí borraría respuestas distintas.
 */
export function quitarCorreosRepetidos<T>(
  filas: T[],
  correoDe: (fila: T) => string | null
): { unicas: T[]; descartadas: number; correosRepetidos: string[] } {
  // Se compara en minúsculas: los correos no distinguen mayúsculas, y el mismo
  // buzón escrito de dos formas es la misma persona.
  const clave = (fila: T) => correoDe(fila)?.trim().toLowerCase() || null;

  const ultimaPosicion = new Map<string, number>();
  filas.forEach((fila, indice) => {
    const correo = clave(fila);
    if (correo) ultimaPosicion.set(correo, indice);
  });

  const repetidos = new Set<string>();
  const unicas = filas.filter((fila, indice) => {
    const correo = clave(fila);
    if (!correo) return true;
    const esLaUltima = ultimaPosicion.get(correo) === indice;
    if (!esLaUltima) repetidos.add(correo);
    return esLaUltima;
  });

  return {
    unicas,
    descartadas: filas.length - unicas.length,
    correosRepetidos: [...repetidos],
  };
}

/**
 * Compara los encabezados de un archivo contra el formato exigido y describe la
 * primera diferencia en términos que el usuario pueda accionar. Devuelve null
 * cuando el formato es correcto.
 */
export function validarColumnas(encabezados: string[]): string | null {
  const recibidas = encabezados.map(normalizar).filter((c) => c.length > 0);
  const esperadas = COLUMNAS_MOMENTO4.map(normalizar);

  // Ni una sola columna en común: no es un export de este formulario con algún
  // problema, es otro archivo. Enumerar cuántas columnas faltan en ese caso
  // sugiere que se puede arreglar editando el Excel, cuando lo que hay que
  // hacer es buscar el archivo correcto.
  if (!esperadas.some((columna) => recibidas.includes(columna))) {
    return "Ninguna de sus columnas coincide con el formulario del Momento 4: parece ser otro archivo. Debe ser el .xlsx exportado de Microsoft Forms.";
  }

  const faltantes = COLUMNAS_MOMENTO4.filter((_, i) => !recibidas.includes(esperadas[i]));
  if (faltantes.length > 0) {
    return `Faltan ${faltantes.length} de las ${COLUMNAS_MOMENTO4.length} columnas del formato. La primera que falta es "${faltantes[0]}".`;
  }

  const sobrantes = recibidas.filter((c) => !esperadas.includes(c));
  if (sobrantes.length > 0) {
    return `El archivo trae ${sobrantes.length} columna(s) que no son del formato. La primera es "${sobrantes[0]}".`;
  }

  const desordenada = esperadas.findIndex((c, i) => recibidas[i] !== c);
  if (desordenada !== -1) {
    return `Las columnas están en otro orden: en la posición ${desordenada + 1} se esperaba "${COLUMNAS_MOMENTO4[desordenada]}".`;
  }

  return null;
}
