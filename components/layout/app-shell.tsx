import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SidebarNav } from "@/components/layout/sidebar-nav";

/**
 * Layout único, sin variante móvil: el proyecto no usa breakpoints
 * responsivos (ver AGENTS.md) — la app siempre se ve como escritorio,
 * incluida esta barra lateral, que nunca colapsa a menú hamburguesa.
 */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[1600px]">
      <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col border-r border-border bg-sidebar py-5">
        <Logo className="shrink-0 px-5 pb-6" />
        <div className="min-h-0 flex-1 overflow-y-auto">
          <SidebarNav />
        </div>
        <div className="flex shrink-0 flex-col gap-2 px-5 pt-6">
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

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/95 px-8 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <div className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
            <span>Universidad de Cundinamarca</span>
          </div>
        </header>

        <main className="flex-1 px-8 py-8">{children}</main>
      </div>
    </div>
  );
}

function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={className}>
      <Image
        src="/assets/logos/imagotipo-horizontal-color.png"
        alt="Universidad de Cundinamarca"
        width={200}
        height={47}
        priority
        className="h-auto w-auto"
      />
      <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-primary">
        Planeación estratégica 2027 – 2037
      </p>
    </Link>
  );
}
