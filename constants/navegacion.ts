import type { LucideIcon } from "lucide-react";
import { Activity, BarChart3, Blocks, LayoutDashboard, Network, Users, Compass, Target, Mic2 } from "lucide-react";

export interface ItemNavegacion {
  href: string;
  etiqueta: string;
  descripcion: string;
  icono: LucideIcon;
}

export const NAVEGACION: ItemNavegacion[] = [
  {
    href: "/encuesta",
    etiqueta: "Diagnóstico: Tu Voz Fundamental",
    descripcion: "Panorama general de la participación",
    icono: LayoutDashboard,
  },
  {
    href: "/encuesta/participacion",
    etiqueta: "Quién participó — Diagnóstico: Tu Voz Fundamental",
    descripcion: "Rol, sede, facultad y programa",
    icono: Users,
  },
  {
    href: "/encuesta/fundamentos-planeacion",
    etiqueta: "Fundamentos de planeación — Diagnóstico: Tu Voz Fundamental",
    descripcion: "Qué debe definir y cómo construir la planeación",
    icono: Blocks,
  },
  {
    href: "/encuesta/vision-estrategica",
    etiqueta: "Visión estratégica — Diagnóstico: Tu Voz Fundamental",
    descripcion: "Decisiones a futuro y visión a 10 años",
    icono: Compass,
  },
  {
    href: "/metas",
    etiqueta: "Metas — Diagnóstico: Tu Voz Fundamental",
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
    href: "/conferencistas",
    etiqueta: "Ciclos de Diálogo Estratégico",
    descripcion: "Jornadas y conferencias del Plan Estratégico",
    icono: Mic2,
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
