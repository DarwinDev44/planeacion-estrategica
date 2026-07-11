import { COLOR_POR_SEDE } from "@/constants/marca";
import type { Sede } from "@/types/encuesta";
import { formatNumero } from "@/lib/formatters";
import { cn } from "@/lib/utils";

export function SedeBarList({
  distribucion,
  compacto = false,
}: {
  distribucion: Record<string, number>;
  compacto?: boolean;
}) {
  const entradas = Object.entries(distribucion).sort(([, a], [, b]) => b - a);
  const max = entradas[0]?.[1] ?? 1;

  return (
    <ul
      className={cn("flex flex-col", compacto ? "gap-1.5" : "gap-3")}
      aria-label="Distribución de participantes por sede"
    >
      {entradas.map(([sede, conteo]) => (
        <li key={sede} className="flex items-center gap-2.5">
          <span
            className="size-2 shrink-0 rounded-full"
            style={{ backgroundColor: COLOR_POR_SEDE[sede as Sede] ?? "var(--muted-foreground)" }}
            aria-hidden
          />
          <span className={cn("shrink-0 text-foreground", compacto ? "w-20 text-[11px]" : "w-24 text-sm")}>
            {sede}
          </span>
          <span
            className={cn(
              "relative flex-1 overflow-hidden rounded-full bg-muted",
              compacto ? "h-1.5" : "h-2.5"
            )}
          >
            <span
              className="absolute inset-y-0 left-0 rounded-full bg-primary"
              style={{ width: `${(conteo / max) * 100}%` }}
            />
          </span>
          <span
            className={cn(
              "shrink-0 text-right font-semibold tabular-nums text-foreground",
              compacto ? "w-11 text-[11px]" : "w-14 text-sm"
            )}
          >
            {formatNumero(conteo)}
          </span>
        </li>
      ))}
    </ul>
  );
}
