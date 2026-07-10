"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Home, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { NAVEGACION } from "@/constants/navegacion";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [menuAbierto, setMenuAbierto] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-30 bg-primary text-primary-foreground shadow-sm">
        <div className="mx-auto flex h-16 max-w-[1800px] items-center gap-3 px-4 lg:px-8">
          <Link href="/" className="flex shrink-0 items-center gap-3">
            <Image
              src="/assets/logos/imagotipo-horizontal-blanco.png"
              alt="Universidad de Cundinamarca"
              width={150}
              height={36}
              priority
              className="h-7 w-auto lg:h-8"
            />
          </Link>
          <div className="hidden h-7 w-px bg-white/25 xl:block" />
          <p className="hidden text-sm font-semibold tracking-wide text-white/95 xl:block">
            Participación, tu voz es fundamental
          </p>

          <nav
            className="ml-auto hidden items-center gap-1 lg:flex"
            aria-label="Navegación entre temas del reporte"
          >
            {NAVEGACION.map((item) => {
              const activo = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={activo ? "page" : undefined}
                  className={cn(
                    "rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors",
                    activo
                      ? "bg-white text-primary shadow-sm"
                      : "text-white/85 hover:bg-white/10 hover:text-white"
                  )}
                >
                  {item.etiqueta}
                </Link>
              );
            })}
          </nav>

          <Button
            render={<Link href="/" aria-label="Volver al inicio" title="Inicio" />}
            nativeButton={false}
            variant="ghost"
            size="icon"
            className="hidden text-white hover:bg-white/10 hover:text-white lg:inline-flex"
          >
            <Home className="size-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="ml-auto text-white hover:bg-white/10 hover:text-white lg:hidden"
            aria-label="Abrir menú de navegación"
            onClick={() => setMenuAbierto(true)}
          >
            <Menu className="size-5" />
          </Button>
        </div>
      </header>

      <Sheet open={menuAbierto} onOpenChange={setMenuAbierto}>
        <SheetContent side="right" className="w-72">
          <SheetHeader className="text-left">
            <SheetTitle>Participación, tu voz es fundamental</SheetTitle>
          </SheetHeader>
          <nav className="flex flex-col gap-1 p-4 pt-0" aria-label="Navegación">
            {NAVEGACION.map((item) => {
              const activo = pathname === item.href;
              const Icono = item.icono;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuAbierto(false)}
                  aria-current={activo ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    activo
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground/80 hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <Icono className="size-4 shrink-0" aria-hidden />
                  {item.etiqueta}
                </Link>
              );
            })}
          </nav>
        </SheetContent>
      </Sheet>

      <main className="mx-auto w-full max-w-[1800px] flex-1 px-4 py-5 lg:px-8 lg:py-6">{children}</main>

      <footer className="border-t border-border px-4 py-3 text-center text-[11px] text-muted-foreground lg:px-8">
        www.ucundinamarca.edu.co · Vigilada MinEducación
      </footer>
    </div>
  );
}
