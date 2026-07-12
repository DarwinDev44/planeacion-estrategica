"use client";

import { motion, useReducedMotion } from "framer-motion";
import { CalendarDays, MapPin, Users, Video, Eye, ExternalLink } from "lucide-react";
import { AvatarConferencista } from "@/components/conferencistas/avatar-conferencista";
import { formatNumero } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import type { ConferenciaCard } from "@/types/conferencistas";

const PALETA_ACENTO = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--primary)",
] as const;

function colorAcento(semilla: string): string {
  let hash = 0;
  for (const char of semilla) hash = (hash * 31 + char.codePointAt(0)!) >>> 0;
  return PALETA_ACENTO[hash % PALETA_ACENTO.length];
}

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
  const prefiereReducido = useReducedMotion();
  const esGrupo = conferencia.tipo === "Grupo";
  const hayPerfilExtendido = conferencia.formacionAcademica.length > 0 || conferencia.trayectoriaDestacada.length > 0;
  const acento = colorAcento(conferencia.nombre);
  const IconoModalidad =
    Object.entries(ICONO_MODALIDAD).find(([clave]) => conferencia.modalidad.includes(clave))?.[1] ?? Video;

  return (
    <motion.div
      role="button"
      tabIndex={0}
      onClick={() => onSeleccionar(conferencia)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSeleccionar(conferencia);
        }
      }}
      whileHover={prefiereReducido ? undefined : { y: -5 }}
      whileTap={prefiereReducido ? undefined : { scale: 0.985 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className="group relative mb-4 block w-full cursor-pointer overflow-hidden rounded-2xl bg-card text-left break-inside-avoid ring-1 ring-foreground/10 [box-shadow:0_1px_2px_rgba(0,0,0,0.04)] transition-shadow duration-300 hover:[box-shadow:0_16px_32px_-12px_rgba(0,0,0,0.18)] focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      <span
        className="absolute inset-x-0 top-0 h-1 opacity-80 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: `linear-gradient(90deg, ${acento}, color-mix(in srgb, ${acento} 40%, transparent))` }}
        aria-hidden
      />

      <div className="flex items-start gap-3.5 p-4 pb-3">
        <AvatarConferencista conferencia={conferencia} tamaño={72} />
        <div className="flex min-w-0 flex-1 flex-col gap-1.5 pt-1">
          <span
            className="inline-flex w-fit items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
            title={conferencia.modalidad}
          >
            <IconoModalidad className="size-3" aria-hidden />
            {conferencia.modalidad}
          </span>
          <h3 className="text-[15.5px] leading-tight font-semibold text-foreground">{conferencia.nombre}</h3>
          {conferencia.tituloProfesional ? (
            <p className="text-[12px] leading-snug font-medium" style={{ color: acento }}>
              {conferencia.tituloProfesional}
            </p>
          ) : null}
        </div>
        {esGrupo ? (
          <span className="shrink-0 rounded-full bg-primary px-2.5 py-1 text-[11px] font-semibold text-primary-foreground">
            Grupo
          </span>
        ) : null}
      </div>

      <div className="flex flex-col gap-2.5 px-4 pb-4">
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

        {hayPerfilExtendido ? (
          <p
            className="text-[11.5px] font-semibold tracking-wide uppercase opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            style={{ color: acento }}
          >
            Ver perfil completo →
          </p>
        ) : null}

        <div
          className={cn(
            "flex items-center justify-between gap-2 border-t border-border pt-3",
            hayPerfilExtendido && "mt-0.5"
          )}
        >
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
    </motion.div>
  );
}
