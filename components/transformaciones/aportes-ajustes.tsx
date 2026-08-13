"use client";

import { useState } from "react";
import { Quote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatNumero } from "@/lib/formatters";
import type { RespuestaMomento4 } from "@/types/momento4";

const PASO = 6;

/**
 * Los aportes de "¿Qué ajustarían en esta transformación?". Se muestran
 * textuales y no resumidos: es la única pregunta abierta del formulario, y su
 * valor está en lo que dice cada persona, no en un conteo.
 */
export function AportesAjustes({ respuestas }: { respuestas: RespuestaMomento4[] }) {
  const [visibles, setVisibles] = useState(PASO);

  const conAporte = respuestas.filter((r) => r.ajustes && r.ajustes.trim().length > 0);
  const mostrados = conAporte.slice(0, visibles);

  if (conAporte.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Ninguna respuesta con los filtros aplicados incluye un ajuste propuesto.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col gap-2.5">
        {mostrados.map((respuesta) => (
          <li
            key={respuesta.id}
            className="flex gap-2.5 rounded-lg border border-border/70 bg-muted/40 px-3.5 py-3"
          >
            <Quote className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="text-sm leading-relaxed text-foreground">{respuesta.ajustes}</p>
              <p className="mt-1.5 text-xs text-muted-foreground">
                {respuesta.etiqueta}
                {respuesta.tipoActor ? ` · ${respuesta.tipoActor}` : ""}
                {respuesta.unidadRegional ? ` · ${respuesta.unidadRegional}` : ""}
              </p>
            </div>
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          {formatNumero(mostrados.length)} de {formatNumero(conAporte.length)} aportes
        </p>
        {visibles < conAporte.length ? (
          <Button variant="outline" size="sm" onClick={() => setVisibles((v) => v + PASO * 2)}>
            Ver más aportes
          </Button>
        ) : null}
      </div>
    </div>
  );
}
