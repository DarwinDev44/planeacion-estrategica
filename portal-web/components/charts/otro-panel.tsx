"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { PreguntaId } from "@/types/encuesta";

export interface RespuestaOtro {
  personaId: number;
  preguntaId: PreguntaId;
  texto: string;
}

const ETIQUETA_PREGUNTA: Record<PreguntaId, string> = {
  P1: "P1",
  P2: "P2",
  P3: "P3 · decisiones a futuro",
  P4: "P4 · visión a 10 años",
};

export function OtroPanel({ respuestas }: { respuestas: RespuestaOtro[] }) {
  const [busqueda, setBusqueda] = useState("");

  const filtradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return respuestas;
    return respuestas.filter((r) => r.texto.toLowerCase().includes(q));
  }, [busqueda, respuestas]);

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar en las respuestas abiertas…"
          className="pl-9"
          aria-label="Buscar en respuestas de tipo Otro"
        />
      </div>
      <p className="text-xs text-muted-foreground">
        {filtradas.length} de {respuestas.length} respuestas de texto libre ({"“Otro”"})
      </p>
      <ScrollArea className="h-[420px] rounded-lg border border-border">
        <ul className="divide-y divide-border">
          {filtradas.map((r, i) => (
            <li key={`${r.personaId}-${i}`} className="flex flex-col gap-1.5 px-4 py-3">
              <Badge variant="outline" className="w-fit text-[10px] font-medium">
                {ETIQUETA_PREGUNTA[r.preguntaId]}
              </Badge>
              <p className="text-sm leading-relaxed text-foreground">{r.texto}</p>
            </li>
          ))}
          {filtradas.length === 0 ? (
            <li className="px-4 py-8 text-center text-sm text-muted-foreground">
              No hay respuestas que coincidan con la búsqueda.
            </li>
          ) : null}
        </ul>
      </ScrollArea>
    </div>
  );
}
