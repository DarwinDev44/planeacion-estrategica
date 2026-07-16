const numberFormatter = new Intl.NumberFormat("es-CO");
const percentFormatter = new Intl.NumberFormat("es-CO", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});
const percentFormatterPreciso = new Intl.NumberFormat("es-CO", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
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
  if (n > 0 && n < 0.05) return "<0,1%";
  return `${percentFormatter.format(n)}%`;
}

// Con 2 decimales y espacio antes del "%", igual al formato de origen del
// módulo Metas (p.ej. "73,21 %").
export function formatPorcentajeMetas(n: number): string {
  if (n > 0 && n < 0.005) return "<0,01 %";
  return `${percentFormatterPreciso.format(n)} %`;
}

export function formatFecha(iso: string): string {
  return dateFormatter.format(new Date(iso));
}
