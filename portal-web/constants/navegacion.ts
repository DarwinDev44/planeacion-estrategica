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
    href: "/encuesta",
    etiqueta: "Resumen ejecutivo",
    descripcion: "Panorama general de la participación",
    icono: LayoutDashboard,
  },
  {
    href: "/encuesta/participacion",
    etiqueta: "Quién participó",
    descripcion: "Rol, sede, facultad y programa",
    icono: Users,
  },
  {
    href: "/encuesta/vision-estrategica",
    etiqueta: "Visión estratégica",
    descripcion: "Las 4 preguntas que orientan el plan",
    icono: Compass,
  },
  {
    href: "/encuesta/exploracion",
    etiqueta: "Exploración",
    descripcion: "Tabla dinámica y exportación",
    icono: Table2,
  },
];
