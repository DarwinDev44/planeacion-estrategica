import type { LucideIcon } from "lucide-react";
import { LayoutDashboard, Users, Compass, Table2 } from "lucide-react";

export interface ItemNavegacion {
  href: string;
  etiqueta: string;
  descripcion: string;
  icono: LucideIcon;
}

export const NAVEGACION: ItemNavegacion[] = [
  {
    href: "/",
    etiqueta: "Resumen ejecutivo",
    descripcion: "Panorama general de la participación",
    icono: LayoutDashboard,
  },
  {
    href: "/participacion",
    etiqueta: "Quién participó",
    descripcion: "Rol, sede, facultad y programa",
    icono: Users,
  },
  {
    href: "/vision-estrategica",
    etiqueta: "Visión estratégica",
    descripcion: "Las 4 preguntas que orientan el plan",
    icono: Compass,
  },
  {
    href: "/exploracion",
    etiqueta: "Exploración",
    descripcion: "Tabla dinámica y exportación",
    icono: Table2,
  },
];
