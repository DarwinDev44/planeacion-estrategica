"use client";

import { CalendarDays, ExternalLink, Eye, GraduationCap, MapPin, Sparkles, Users, Video } from "lucide-react";
import { AvatarConferencista } from "@/components/conferencistas/avatar-conferencista";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatNumero } from "@/lib/formatters";
import type { ConferenciaCard } from "@/types/conferencistas";

interface DetalleConferencistaProps {
  conferencia: ConferenciaCard | null;
  onCerrar: () => void;
}

export function DetalleConferencista({ conferencia, onCerrar }: DetalleConferencistaProps) {
  return (
    <Dialog open={conferencia !== null} onOpenChange={(abierto) => !abierto && onCerrar()}>
      {conferencia ? <ContenidoDetalle key={conferencia.id} conferencia={conferencia} /> : null}
    </Dialog>
  );
}

function ContenidoDetalle({ conferencia }: { conferencia: ConferenciaCard }) {
  const IconoModalidad = conferencia.modalidad.includes("Virtual") ? Video : MapPin;
  const hayFormacion = conferencia.formacionAcademica.length > 0;
  const hayTrayectoria = conferencia.trayectoriaDestacada.length > 0;

  return (
    <DialogContent className="sm:max-w-2xl">
      <DialogHeader>
        <div className="flex items-start gap-4">
          <AvatarConferencista conferencia={conferencia} tamaño={80} />
          <div className="flex min-w-0 flex-1 flex-col gap-1 pt-1">
            <DialogTitle className="pr-8 text-lg leading-snug">{conferencia.nombre}</DialogTitle>
            {conferencia.tituloProfesional ? (
              <p className="text-sm leading-snug font-medium text-primary">{conferencia.tituloProfesional}</p>
            ) : null}
            <DialogDescription>{conferencia.titulo}</DialogDescription>
          </div>
        </div>
      </DialogHeader>

      <ScrollArea className="min-h-0 flex-1 pr-3">
        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="gap-1">
              <IconoModalidad className="size-3" aria-hidden />
              {conferencia.modalidad}
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <CalendarDays className="size-3" aria-hidden />
              {conferencia.fecha}
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <MapPin className="size-3" aria-hidden />
              {conferencia.ubicacion}
            </Badge>
          </div>

          {conferencia.descripcion ? (
            <p className="text-sm leading-relaxed text-foreground">{conferencia.descripcion}</p>
          ) : null}

          {hayFormacion ? (
            <SeccionBullets
              icono={GraduationCap}
              titulo="Formación académica"
              items={conferencia.formacionAcademica}
            />
          ) : null}

          {hayTrayectoria ? (
            <SeccionBullets icono={Sparkles} titulo="Trayectoria destacada" items={conferencia.trayectoriaDestacada} />
          ) : null}

          {conferencia.asistentesPresenciales != null ||
          conferencia.vistasRedesSociales != null ||
          conferencia.enlace ? (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                {conferencia.asistentesPresenciales != null ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Users className="size-3.5" aria-hidden />
                    {formatNumero(conferencia.asistentesPresenciales)} asistentes presenciales
                  </span>
                ) : null}
                {conferencia.vistasRedesSociales != null ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Eye className="size-3.5" aria-hidden />
                    {formatNumero(conferencia.vistasRedesSociales)} vistas en redes
                  </span>
                ) : null}
              </div>
              {conferencia.enlace ? (
                <a
                  href={conferencia.enlace}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                >
                  Ver grabación
                  <ExternalLink className="size-3.5" aria-hidden />
                </a>
              ) : null}
            </div>
          ) : null}
        </div>
      </ScrollArea>
    </DialogContent>
  );
}

function SeccionBullets({
  icono: Icono,
  titulo,
  items,
}: {
  icono: typeof GraduationCap;
  titulo: string;
  items: string[];
}) {
  return (
    <section aria-label={titulo}>
      <h3 className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        <Icono className="size-3.5 text-primary" aria-hidden />
        {titulo}
      </h3>
      <ul className="mt-2 flex flex-col gap-1.5">
        {items.map((item) => (
          <li key={item} className="flex gap-2 text-sm leading-relaxed text-foreground">
            <span className="mt-2 size-1 shrink-0 rounded-full bg-primary" aria-hidden />
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}
