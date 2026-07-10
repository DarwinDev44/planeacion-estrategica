"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAVEGACION } from "@/constants/navegacion";

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1.5 px-3" aria-label="Navegación de la sección">
      {NAVEGACION.map((item) => {
        const activo = pathname === item.href;
        const Icono = item.icono;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={activo ? "page" : undefined}
            className={cn(
              "group flex items-start gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              activo
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-foreground/75 hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <span
              className={cn(
                "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg",
                activo ? "bg-white/15" : "bg-secondary text-primary group-hover:bg-white"
              )}
            >
              <Icono className="size-4" aria-hidden />
            </span>
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
