"use client";

import { useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { SidebarNav } from "@/components/layout/sidebar-nav";

export function AppShell({ children }: { children: ReactNode }) {
  const [menuAbierto, setMenuAbierto] = useState(false);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[1600px]">
      {/* Sidebar desktop */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-sidebar py-5 lg:flex">
        <Logo className="px-5 pb-6" />
        <SidebarNav />
        <div className="mt-auto flex flex-col gap-2 px-5 pt-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
          >
            <ArrowLeft className="size-3.5" />
            Volver al inicio
          </Link>
          <p className="text-xs text-muted-foreground">
            Plan Estratégico
            <br />
            2027 – 2037
          </p>
        </div>
      </aside>

      {/* Sidebar mobile (Sheet, no bloqueante — cumple la regla del manual) */}
      <Sheet open={menuAbierto} onOpenChange={setMenuAbierto}>
        <SheetContent side="left" className="w-72 p-0">
          <SheetHeader className="p-5 pb-2">
            <SheetTitle className="sr-only">Menú de navegación</SheetTitle>
            <Logo />
          </SheetHeader>
          <div className="py-4">
            <SidebarNav onNavigate={() => setMenuAbierto(false)} />
          </div>
          <div className="px-8 pt-2">
            <Link
              href="/"
              onClick={() => setMenuAbierto(false)}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
            >
              <ArrowLeft className="size-3.5" />
              Volver al inicio
            </Link>
          </div>
        </SheetContent>
      </Sheet>

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 lg:px-8">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label="Abrir menú de navegación"
            onClick={() => setMenuAbierto(true)}
          >
            <Menu className="size-5" />
          </Button>
          <div className="lg:hidden">
            <Logo compact />
          </div>
          <div className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
            <span className="hidden sm:inline">Universidad de Cundinamarca</span>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}

function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <Link href="/" className={className}>
      <Image
        src="/assets/logos/imagotipo-horizontal-color.png"
        alt="Universidad de Cundinamarca"
        width={compact ? 140 : 170}
        height={compact ? 33 : 40}
        priority
        className="h-auto w-auto"
      />
      <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-primary">
        Planeación estratégica 2027 – 2037
      </p>
    </Link>
  );
}
