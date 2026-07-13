/**
 * Frecuencia de palabras "con sentido" a partir de un conjunto de textos
 * libres en español: se descartan artículos, preposiciones, conjunciones,
 * pronombres y verbos auxiliares (palabras vacías / stopwords), quedando solo
 * el vocabulario de contenido. Usado para la nube de palabras de aprendizajes
 * y mejoras en Analítica actividades momentos.
 */

const STOPWORDS_ES = new Set([
  // artículos
  "el", "la", "los", "las", "un", "una", "unos", "unas", "lo", "al", "del",
  // preposiciones
  "a", "ante", "bajo", "cabe", "con", "contra", "de", "desde", "durante",
  "en", "entre", "hacia", "hasta", "mediante", "para", "por", "según", "sin",
  "so", "sobre", "tras", "versus", "via", "vía",
  // conjunciones y nexos
  "y", "e", "ni", "o", "u", "pero", "sino", "aunque", "porque", "pues", "que",
  "si", "como", "cuando", "donde", "mientras", "entonces", "luego", "además",
  "embargo", "asi", "así", "tanto", "asimismo",
  // pronombres y determinantes
  "yo", "tu", "tú", "usted", "ustedes", "el", "él", "ella", "ello",
  "nosotros", "nosotras", "vosotros", "vosotras", "ellos", "ellas", "me",
  "te", "se", "nos", "os", "le", "les", "mi", "mis", "tus", "su", "sus",
  "nuestro", "nuestra", "nuestros", "nuestras", "vuestro", "vuestra", "esto",
  "eso", "aquello", "este", "esta", "estos", "estas", "ese", "esa", "esos",
  "esas", "aquel", "aquella", "aquellos", "aquellas", "quien", "quienes",
  "cual", "cuales", "cuyo", "cuya", "cuyos", "cuyas", "todo", "toda",
  "todos", "todas", "algo", "alguna", "algunas", "alguno", "algunos",
  "ningun", "ningún", "ninguna", "ninguno", "nada", "nadie", "cada", "otro",
  "otra", "otros", "otras", "mismo", "misma", "mismos", "mismas", "propio",
  "propia",
  // verbos auxiliares / muy comunes
  "es", "son", "era", "eran", "fue", "fueron", "ser", "siendo", "sido",
  "soy", "eres", "somos", "sois", "esta", "está", "estan", "están", "estar",
  "estaba", "estaban", "estuvo", "estuvieron", "estoy", "estamos", "estas",
  "estás", "hay", "habia", "había", "habian", "habían", "ha", "han", "he",
  "has", "hemos", "habeis", "habéis", "habra", "habrá", "habria", "habría",
  "tiene", "tienen", "tener", "tuvo", "tenia", "tenía", "tenian", "tenían",
  "tengo", "tenemos", "hace", "hacen", "hacer", "hacia", "hizo", "hecho",
  "puede", "pueden", "poder", "podria", "podría", "podrian", "podrían",
  "debe", "deben", "deber", "deberia", "debería", "va", "van", "ir", "iba",
  "seria", "sería", "serian", "serían",
  // adverbios y cuantificadores genéricos
  "mas", "más", "menos", "muy", "mucho", "mucha", "muchos", "muchas",
  "poco", "poca", "pocos", "pocas", "tampoco", "tambien", "también", "aqui",
  "aquí", "alli", "allí", "ahi", "ahí", "ya", "aun", "aún", "todavia",
  "todavía", "bien", "mal", "peor", "solo", "sólo", "sola", "solos", "solas",
  "no", "si", "sí",
]);

const MIN_LARGO_PALABRA = 3;
const MAX_PALABRAS_DEFECTO = 60;
const FRECUENCIA_MINIMA_DEFECTO = 2;

export interface PalabraFrecuencia {
  palabra: string;
  frecuencia: number;
}

/**
 * Clave de agrupación: minúsculas, sin acentos y con un stemming ligero de
 * plurales ("-es"/"-s") para unir variantes como "aprendizaje"/"aprendizajes"
 * o "mejora"/"mejoras". La palabra que se muestra siempre es la forma
 * original más frecuente del grupo, nunca esta clave.
 */
function normalizarClave(token: string): string {
  const sinAcentos = token.normalize("NFD").replace(/[̀-ͯ]/g, "");
  if (sinAcentos.endsWith("es") && sinAcentos.length > 5) {
    return sinAcentos.slice(0, -2);
  }
  if (sinAcentos.endsWith("s") && sinAcentos.length > 4) {
    return sinAcentos.slice(0, -1);
  }
  return sinAcentos;
}

export function calcularFrecuenciaPalabras(
  textos: string[],
  opciones: { maxPalabras?: number; frecuenciaMinima?: number } = {}
): PalabraFrecuencia[] {
  const maxPalabras = opciones.maxPalabras ?? MAX_PALABRAS_DEFECTO;
  const frecuenciaMinima = opciones.frecuenciaMinima ?? FRECUENCIA_MINIMA_DEFECTO;

  const grupos = new Map<string, { total: number; formas: Map<string, number> }>();

  for (const texto of textos) {
    if (!texto) continue;
    const tokens = texto.toLowerCase().match(/[a-záéíóúñü]+/g);
    if (!tokens) continue;

    for (const token of tokens) {
      if (token.length < MIN_LARGO_PALABRA || STOPWORDS_ES.has(token)) continue;
      const clave = normalizarClave(token);
      if (STOPWORDS_ES.has(clave)) continue;

      let grupo = grupos.get(clave);
      if (!grupo) {
        grupo = { total: 0, formas: new Map() };
        grupos.set(clave, grupo);
      }
      grupo.total += 1;
      grupo.formas.set(token, (grupo.formas.get(token) ?? 0) + 1);
    }
  }

  const resultado: PalabraFrecuencia[] = [];
  for (const grupo of grupos.values()) {
    if (grupo.total < frecuenciaMinima) continue;
    let formaFrecuente = "";
    let maxConteo = 0;
    for (const [forma, conteo] of grupo.formas) {
      if (conteo > maxConteo || (conteo === maxConteo && forma < formaFrecuente)) {
        formaFrecuente = forma;
        maxConteo = conteo;
      }
    }
    resultado.push({ palabra: formaFrecuente, frecuencia: grupo.total });
  }

  return resultado.sort((a, b) => b.frecuencia - a.frecuencia).slice(0, maxPalabras);
}
