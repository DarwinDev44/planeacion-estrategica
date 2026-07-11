import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RankedBarChart } from "@/components/charts/ranked-bar-chart";
import { formatNumero, formatPorcentaje } from "@/lib/formatters";
import type { AnalisisOtro } from "@/types/encuesta";

/**
 * Lectura analítica de las respuestas abiertas ("Otro"): distribución por
 * categoría temática (con descripción y una cita representativa por tema) y
 * conclusión del análisis cualitativo.
 */
export function AnalisisOtroCards({ analisis }: { analisis: AnalisisOtro }) {
  const conCitas = analisis.categorias.filter((c) => c.conteo > 0);

  return (
    <>
      <Card className="py-3">
        <CardHeader className="px-3.5 pb-1">
          <CardTitle className="text-[13px]">Categorización de las respuestas abiertas</CardTitle>
          <p className="text-[11px] text-muted-foreground">
            Los {formatNumero(analisis.total)} aportes de texto libre, agrupados en {conCitas.length} temas.
          </p>
        </CardHeader>
        <CardContent className="px-3.5">
          <div className="grid gap-6 lg:grid-cols-2">
            <RankedBarChart
              titulo=""
              datos={analisis.categorias.map((c) => ({
                etiqueta: c.nombre,
                conteo: c.conteo,
                porcentaje: c.porcentaje,
              }))}
              alturaFila={40}
              truncarEn={44}
              ocultarAccion
            />
            <ul className="flex flex-col gap-3">
              {conCitas.map((c) => (
                <li key={c.id} className="flex flex-col gap-0.5">
                  <p className="text-xs font-semibold text-foreground">
                    {c.nombre}{" "}
                    <span className="font-normal tabular-nums text-muted-foreground">
                      · {formatNumero(c.conteo)} ({formatPorcentaje(c.porcentaje)})
                    </span>
                  </p>
                  <p className="text-[11px] leading-relaxed text-muted-foreground">{c.descripcion}</p>
                  {c.citas[0] ? (
                    <p className="text-[11px] italic leading-relaxed text-muted-foreground/80">
                      &ldquo;{c.citas[0]}&rdquo;
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card className="py-3">
        <CardHeader className="px-3.5 pb-1">
          <CardTitle className="text-[13px]">Conclusión</CardTitle>
          <p className="text-[11px] text-muted-foreground">
            Lectura general de los aportes abiertos y su implicación para el Plan Estratégico 2027–2037.
          </p>
        </CardHeader>
        <CardContent className="px-3.5">
          <p className="border-l-2 border-primary pl-3 text-sm leading-relaxed text-foreground">
            {analisis.conclusion}
          </p>
        </CardContent>
      </Card>
    </>
  );
}
