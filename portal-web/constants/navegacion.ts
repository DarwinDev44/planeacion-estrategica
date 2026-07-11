import type { LucideIcon } from "lucide-react";
import { Activity, BarChart3, LayoutDashboard, Network, Users, Compass, Target } from "lucide-react";

export interface ItemNavegacion {
  href: string;
  etiqueta: string;
  descripcion: string;
  icono: LucideIcon;
}

export const NAVEGACION: ItemNavegacion[] = [
  {
    href: "/encuesta",
    etiqueta: "Panorama de participación, encuesta tu voz fundamental",
    descripcion: "Panorama general de la participación",
    icono: LayoutDashboard,
  },
  {
    href: "/encuesta/participacion",
    etiqueta: "Quién participó, encuesta tu voz fundamental",
    descripcion: "Rol, sede, facultad y programa",
    icono: Users,
  },
  {
    href: "/encuesta/vision-estrategica",
    etiqueta: "Visión estratégica, encuesta tu voz fundamental",
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
    href: "/analitica-momentos",
    etiqueta: "Analítica actividades momentos",
    descripcion: "Valoración por actividad y momento",
    icono: BarChart3,
  },
  {
    href: "/accesos-cai",
    etiqueta: "Accesos a CAI",
    descripcion: "Evolución de accesos",
    icono: Network,
  },
];
