import { COLOR_POR_SEDE } from "@/constants/marca";
import type { Sede } from "@/types/encuesta";
import { formatNumero } from "@/lib/formatters";

export function SedeBarList({ distribucion }: { distribucion: Record<string, number> }) {
  const entradas = Object.entries(distribucion).sort(([, a], [, b]) => b - a);
  const max = entradas[0]?.[1] ?? 1;

  return (
    <ul className="flex flex-col gap-3" aria-label="Distribución de participantes por sede">
      {entradas.map(([sede, conteo]) => (
        <li key={sede} className="flex items-center gap-3">
          <span
            className="size-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: COLOR_POR_SEDE[sede as Sede] ?? "var(--muted-foreground)" }}
            aria-hidden
          />
          <span className="w-24 shrink-0 text-sm text-foreground">{sede}</span>
          <span className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
            <span
              className="absolute inset-y-0 left-0 rounded-full bg-primary"
              style={{ width: `${(conteo / max) * 100}%` }}
            />
          </span>
          <span className="w-14 shrink-0 text-right text-sm font-medium tabular-nums text-foreground">
            {formatNumero(conteo)}
          </span>
        </li>
      ))}
    </ul>
  );
}
