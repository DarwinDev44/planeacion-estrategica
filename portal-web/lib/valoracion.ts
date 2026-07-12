/**
 * Un gráfico de valoración es Likert cuando TODOS sus valores son enteros
 * dentro de 1→5: es la valoración discreta que la persona dio (5, 4, 3…), y se
 * etiqueta con la palabra de nivel ("Muy alto"…). Si algún valor es decimal,
 * es una calificación/promedio (p. ej. 3,89) y se muestra solo como puntaje
 * "X/5", para que la lectura sea coherente entre enteros y decimales.
 *
 * Vive en un módulo neutro (sin "use client" ni "server-only") para poder
 * usarse tanto desde la página (Server Component) como desde el gráfico
 * (Client Component).
 */
export function esDistribucionLikert(distribucion: { valorNumerico: number }[]): boolean {
  return distribucion.every(
    (op) => Number.isInteger(op.valorNumerico) && op.valorNumerico >= 1 && op.valorNumerico <= 5
  );
}
