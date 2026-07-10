"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, CircleAlert, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { coincideBusqueda } from "@/lib/buscar";
import { formatNumero, formatPorcentaje } from "@/lib/formatters";
import type { Actividad, ParticipanteEstado } from "@/types/cai";

interface DetalleActividadProps {
  actividad: Actividad | null;
  onCerrar: () => void;
}

export function DetalleActividad({ actividad, onCerrar }: DetalleActividadProps) {
  return (
    <Dialog open={actividad !== null} onOpenChange={(abierto) => !abierto && onCerrar()}>
      {actividad ? <ContenidoDetalle key={actividad.id} actividad={actividad} /> : null}
    </Dialog>
  );
}

function ContenidoDetalle({ actividad }: { actividad: Actividad }) {
  const [busqueda, setBusqueda] = useState("");

  const filtrados = useMemo(
    () => actividad.participantes.filter((p) => coincideBusqueda(busqueda, p.nombre, p.correo)),
    [actividad.participantes, busqueda]
  );

  const pendientes = filtrados.filter((p) => p.estado === "No finalizado");
  const finalizados = filtrados.filter((p) => p.estado === "Finalizado");

  return (
    <DialogContent className="sm:max-w-xl">
      <DialogHeader>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{actividad.etiquetaMomento}</Badge>
          <Badge variant="outline" className="tabular-nums">
            {formatPorcentaje(actividad.porcentajeFinalizacion)} finalizado
          </Badge>
        </div>
        <DialogTitle className="pr-8 leading-snug">{actividad.nombre}</DialogTitle>
        <DialogDescription>
          {actividad.tituloCompleto} · {formatNumero(actividad.finalizados)} de{" "}
          {formatNumero(actividad.participantes.length)} participantes la finalizaron
        </DialogDescription>
      </DialogHeader>

      <div className="relative">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          type="search"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre o correo…"
          aria-label="Buscar participante"
          className="pl-9"
        />
      </div>

      <ScrollArea className="max-h-[50vh] pr-3">
        <div className="flex flex-col gap-5">
          <GrupoParticipantes
            titulo="No finalizado"
            participantes={pendientes}
            vacio={busqueda ? "Sin coincidencias" : "Nadie tiene esta actividad pendiente 🎉"}
            tono="pendiente"
          />
          <GrupoParticipantes
            titulo="Finalizado"
            participantes={finalizados}
            vacio="Sin coincidencias"
            tono="finalizado"
          />
        </div>
      </ScrollArea>
    </DialogContent>
  );
}

function GrupoParticipantes({
  titulo,
  participantes,
  vacio,
  tono,
}: {
  titulo: string;
  participantes: ParticipanteEstado[];
  vacio: string;
  tono: "finalizado" | "pendiente";
}) {
  const esPendiente = tono === "pendiente";
  const Icono = esPendiente ? CircleAlert : CheckCircle2;

  return (
    <section aria-label={titulo}>
      <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <Icono
          className="size-3.5"
          style={{ color: esPendiente ? "var(--estado-pendiente)" : "var(--estado-finalizado)" }}
          aria-hidden
        />
        {titulo}
        <span className="tabular-nums">({formatNumero(participantes.length)})</span>
      </h3>
      {participantes.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">{vacio}</p>
      ) : (
        <ul className="mt-2 flex flex-col gap-1">
          {participantes.map((p) => (
            <li
              key={p.correo}
              className={
                esPendiente
                  ? "rounded-md border border-(--estado-pendiente)/30 bg-(--estado-pendiente)/8 px-3 py-2"
                  : "rounded-md bg-muted/50 px-3 py-2"
              }
            >
              <span className="block text-sm font-medium text-foreground">{p.nombre}</span>
              <span className="block truncate text-xs text-muted-foreground">{p.correo}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
