import type { LucideIcon } from "lucide-react";
import { Activity, LayoutDashboard, Network, Users, Compass, Target } from "lucide-react";

export interface ItemNavegacion {
  href: string;
  etiqueta: string;
  descripcion: string;
  icono: LucideIcon;
}

export const NAVEGACION: ItemNavegacion[] = [
  {
    href: "/encuesta",
    etiqueta: "Panorama de participación",
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
    href: "/metas",
    etiqueta: "Metas, encuesta tu voz fundamental",
    descripcion: "Cumplimiento de metas por categoría",
    icono: Target,
  },
  {
    href: "/seguimiento",
    etiqueta: "Valoración momentos",
    descripcion: "Seguimiento y avance por actividad",
    icono: Activity,
  },
  {
    href: "/accesos-cai",
    etiqueta: "Accesos a CAI",
    descripcion: "Recencia y evolución de accesos",
    icono: Network,
  },
];
