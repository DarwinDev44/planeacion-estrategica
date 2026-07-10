import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  etiqueta: string;
  valor: string;
  detalle?: string;
  icono: LucideIcon;
  className?: string;
}

export function KpiCard({ etiqueta, valor, detalle, icono: Icono, className }: KpiCardProps) {
  return (
    <Card className={cn("border-border/70", className)}>
      <CardContent className="flex items-start justify-between gap-3 px-5 py-4">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-muted-foreground">{etiqueta}</span>
          <span className="font-heading text-3xl font-bold tabular-nums leading-none lg:text-[2.25rem]">
            {valor}
          </span>
          {detalle ? <span className="text-xs text-muted-foreground">{detalle}</span> : null}
        </div>
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
          <Icono className="size-5" aria-hidden />
        </span>
      </CardContent>
    </Card>
  );
}
