const numberFormatter = new Intl.NumberFormat("es-CO");
const percentFormatter = new Intl.NumberFormat("es-CO", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});
const dateFormatter = new Intl.DateTimeFormat("es-CO", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export function formatNumero(n: number): string {
  return numberFormatter.format(n);
}

export function formatPorcentaje(n: number): string {
  return `${percentFormatter.format(n)}%`;
}

export function formatFecha(iso: string): string {
  return dateFormatter.format(new Date(iso));
}
