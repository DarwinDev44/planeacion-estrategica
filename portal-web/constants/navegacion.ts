import type { LucideIcon } from "lucide-react";
import { LayoutDashboard } from "lucide-react";

export interface ItemNavegacion {
  href: string;
  etiqueta: string;
  descripcion: string;
  icono: LucideIcon;
}

export const NAVEGACION: ItemNavegacion[] = [
  {
    href: "/encuesta",
    etiqueta: "Seguimiento actividades",
    descripcion: "Participación y avance por actividad",
    icono: LayoutDashboard,
  },
];
