/** Normaliza para búsqueda: minúsculas y sin tildes/diacríticos. */
export function normalizarTexto(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

/**
 * true si `consulta` aparece en alguno de los `campos`, ignorando
 * mayúsculas y tildes. Con consulta vacía siempre coincide.
 */
export function coincideBusqueda(consulta: string, ...campos: string[]): boolean {
  const q = normalizarTexto(consulta.trim());
  if (!q) return true;
  return campos.some((campo) => normalizarTexto(campo).includes(q));
}
