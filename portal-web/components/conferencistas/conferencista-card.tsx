import { CalendarDays, MapPin, Users, Video, Eye, ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/card";
import { AvatarConferencista } from "@/components/conferencistas/avatar-conferencista";
import { formatNumero } from "@/lib/formatters";
import type { ConferenciaCard } from "@/types/conferencistas";

const ICONO_MODALIDAD: Record<string, typeof MapPin> = {
  Virtual: Video,
  Presencial: MapPin,
};

export function ConferencistaCard({
  conferencia,
  onSeleccionar,
}: {
  conferencia: ConferenciaCard;
  onSeleccionar: (conferencia: ConferenciaCard) => void;
}) {
  const esGrupo = conferencia.tipo === "Grupo";
  const IconoModalidad =
    Object.entries(ICONO_MODALIDAD).find(([clave]) => conferencia.modalidad.includes(clave))?.[1] ?? Video;

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={() => onSeleccionar(conferencia)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSeleccionar(conferencia);
        }
      }}
      className="group cursor-pointer gap-3 p-4 text-left shadow-sm transition-shadow hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      <div className="flex items-start gap-3">
        <AvatarConferencista conferencia={conferencia} tamaño={64} />
        <div className="flex min-w-0 flex-1 flex-col gap-1 pt-1">
          <span
            className="inline-flex w-fit items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
            title={conferencia.modalidad}
          >
            <IconoModalidad className="size-3" aria-hidden />
            {conferencia.modalidad}
          </span>
          <h3 className="text-[15px] leading-tight font-semibold text-foreground">{conferencia.nombre}</h3>
          {conferencia.tituloProfesional ? (
            <p className="text-[12px] leading-snug text-muted-foreground">{conferencia.tituloProfesional}</p>
          ) : null}
        </div>
        {esGrupo ? (
          <span className="shrink-0 rounded-full bg-primary px-2.5 py-1 text-[11px] font-semibold text-primary-foreground">
            Grupo
          </span>
        ) : null}
      </div>

      <div className="flex flex-col gap-2.5">
        <p className="text-[13px] leading-snug font-medium text-foreground">{conferencia.titulo}</p>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <CalendarDays className="size-3.5 shrink-0 text-primary" aria-hidden />
            {conferencia.fecha}
          </span>
          <span className="inline-flex items-center gap-1">
            <MapPin className="size-3.5 shrink-0 text-primary" aria-hidden />
            {conferencia.ubicacion}
          </span>
        </div>

        {conferencia.descripcion ? (
          <p className="text-[12.5px] leading-relaxed text-muted-foreground">{conferencia.descripcion}</p>
        ) : null}

        <div className="mt-1 flex items-center justify-between gap-2 border-t border-border pt-3">
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
            {conferencia.asistentesPresenciales != null ? (
              <span className="inline-flex items-center gap-1" title="Asistentes presenciales">
                <Users className="size-3.5" aria-hidden />
                {formatNumero(conferencia.asistentesPresenciales)}
              </span>
            ) : null}
            {conferencia.vistasRedesSociales != null ? (
              <span className="inline-flex items-center gap-1" title="Vistas en redes sociales">
                <Eye className="size-3.5" aria-hidden />
                {formatNumero(conferencia.vistasRedesSociales)}
              </span>
            ) : null}
          </div>

          {conferencia.enlace ? (
            <a
              href={conferencia.enlace}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 text-[11.5px] font-medium text-primary hover:underline"
            >
              Ver grabación
              <ExternalLink className="size-3" aria-hidden />
            </a>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
