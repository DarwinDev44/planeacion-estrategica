import "server-only";

/**
 * Envuelve un constructor para que se ejecute una sola vez por proceso y
 * devuelva siempre la misma instancia.
 *
 * Los orígenes de datos son singletons porque su caché en memoria vive en la
 * instancia: construir uno nuevo en cada consulta tiraría la caché y volvería a
 * parsear el Excel. Centralizarlo aquí evita repetir la variable mutable y el
 * `if (!instancia)` en cada `get*DataSource()`.
 */
export function crearSingleton<T>(construir: () => T): () => T {
  let instancia: T | undefined;
  return () => (instancia ??= construir());
}
