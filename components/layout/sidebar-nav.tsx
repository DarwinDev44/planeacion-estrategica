"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAVEGACION } from "@/constants/navegacion";

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  // Ítem activo = el href más específico que coincide con la ruta actual
  // (exacto o prefijo de subruta), para que las páginas de detalle
  // ("/analitica-momentos/[slug]") resalten a su padre sin activar a la vez
  // otros ítems de nivel superior que comparten prefijo (p. ej. "/encuesta").
  const hrefActivo = [...NAVEGACION]
    .filter((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;

  return (
    <nav className="flex flex-col gap-1 px-3" aria-label="Navegación principal">
      {NAVEGACION.map((item) => {
        const activo = item.href === hrefActivo;
        const Icono = item.icono;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={activo ? "page" : undefined}
            className={cn(
              "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              activo
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-foreground/75 hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <Icono className="size-[18px] shrink-0" aria-hidden />
            <span className="flex flex-col leading-tight">
              <span>{item.etiqueta}</span>
              <span
                className={cn(
                  "text-xs font-normal",
                  activo ? "text-primary-foreground/80" : "text-muted-foreground"
                )}
              >
                {item.descripcion}
              </span>
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
