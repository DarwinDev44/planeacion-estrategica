const SOLO_PUNTUACION = /^[\s.,;:!?¿¡\-_*#/\\'"()]*$/;
const SOLO_DIGITOS = /^\d+$/;

// Respuestas de tipo "Otro" que no aportan contenido real: no-respuestas
// convencionales de encuesta, muletillas o simples repeticiones del rótulo
// "otra" de la opción. Se comparan ya normalizadas (minúsculas, sin tildes).
const RESPUESTAS_SIN_VALOR = new Set([
  "n/a",
  "na",
  "no aplica",
  "no se",
  "nose",
  "otra",
  "otras",
  "otraa",
  "test",
  "prueba",
  "asdf",
  "qwerty",
  "x",
  "xd",
  "mm",
  "mmm",
]);

// Rango Unicode de las marcas diacríticas combinadas (acentos sueltos tras
// normalizar a forma NFD). Se filtra por código de punto para no depender de
// escapes \\uXXXX en el literal de la expresión regular.
function quitarDiacriticos(texto: string): string {
  return Array.from(texto)
    .filter((caracter) => {
      const codigo = caracter.codePointAt(0) ?? 0;
      return codigo < 0x0300 || codigo > 0x036f;
    })
    .join("");
}

function normalizar(texto: string): string {
  return quitarDiacriticos(texto.trim().toLowerCase().normalize("NFD"));
}

/**
 * Determina si una respuesta de texto libre ("Otro") aporta contenido real.
 * Filtra vacíos, solo puntuación, solo números, muletillas conocidas y
 * fragmentos de 1-2 letras sin sentido — sin tocar el dato fuente en Excel,
 * solo la visualización.
 */
export function esRespuestaValida(textoOriginal: string): boolean {
  const texto = textoOriginal.trim();
  if (!texto) return false;
  if (SOLO_PUNTUACION.test(texto)) return false;
  if (SOLO_DIGITOS.test(texto)) return false;

  const normalizado = normalizar(texto);
  if (RESPUESTAS_SIN_VALOR.has(normalizado)) return false;

  const soloLetras = normalizado.replace(/[^a-z]/g, "");
  if (soloLetras.length > 0 && soloLetras.length <= 2) return false;

  // Frases de exactamente 2 palabras: suelen ser fragmentos sin desarrollar
  // ("mas titulos") más que una respuesta completa.
  const palabras = texto.split(/\s+/).filter(Boolean);
  if (palabras.length === 2) return false;

  return true;
}
