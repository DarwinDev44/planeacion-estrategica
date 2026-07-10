import type { Rol, Sede } from "@/types/encuesta";

/**
 * Color oficial por sede — Manual de Imagen Institucional ECOM002V_18, pág. 39.
 * Uso: badges/chips de identidad de marca junto al nombre de la sede.
 * NO usar como paleta categórica primaria en gráficos multi-serie (falla
 * validación CVD — ver docs/03-design-system-dashboards.md, §1.3).
 */
export const COLOR_POR_SEDE: Record<Sede, string> = {
  Fusagasugá: "#00A99D",
  Facatativá: "#007B3E",
  Chía: "#79C000",
  Soacha: "#91C256",
  Ubaté: "#00482B",
  Girardot: "#DAAA00",
  Zipaquirá: "#F7931E",
  Bogotá: "#4D4D4D",
};

/**
 * Paleta categórica validada (CVD + contraste) para la dimensión Rol.
 * Ver docs/03-design-system-dashboards.md §1.3 para el detalle de validación.
 */
export const COLOR_POR_ROL: Record<Rol, string> = {
  Estudiante: "var(--chart-1)",
  Graduado: "var(--chart-2)",
  "Gestores del Conocimiento y el Aprendizaje": "var(--chart-3)",
  "Ops-Apa": "var(--chart-4)",
  Administrativo: "var(--chart-5)",
};

export const ETIQUETA_ROL_CORTA: Record<Rol, string> = {
  Estudiante: "Estudiante",
  Graduado: "Graduado",
  "Gestores del Conocimiento y el Aprendizaje": "GCA",
  "Ops-Apa": "Ops-Apa",
  Administrativo: "Administrativo",
};

export const SEDES_ORDENADAS: Sede[] = [
  "Fusagasugá",
  "Facatativá",
  "Chía",
  "Soacha",
  "Ubaté",
  "Girardot",
  "Zipaquirá",
  "Bogotá",
];
