import { CalendarDays, MapPin, Users, Video, Eye, ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/card";
import { formatNumero } from "@/lib/formatters";
import type { ConferenciaCard } from "@/types/conferencistas";

/**
 * Tarjeta única y reutilizable para cualquier fila del Excel de
 * conferencistas: no hay una card por persona, se renderiza la misma
 * plantilla para cada `ConferenciaCard` que llegue del repositorio, así que
 * agregar/quitar conferencistas en la fuente no requiere tocar código.
 *
 * No hay fotografías en "Base de Datos" (la única imagen del archivo vive en
 * la otra hoja, fuera de alcance), así que el "retrato" es un avatar de
 * iniciales con un tinte de color derivado del nombre — determinístico
 * (mismo nombre, mismo color siempre) y tomado de la paleta categórica ya
 * validada del proyecto, no un color inventado.
 */

const PALETA_AVATAR = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--primary)",
] as const;

function colorAvatar(semilla: string): string {
  let hash = 0;
  for (const char of semilla) hash = (hash * 31 + char.codePointAt(0)!) >>> 0;
  return PALETA_AVATAR[hash % PALETA_AVATAR.length];
}

function iniciales(nombre: string): string {
  const palabras = nombre.trim().split(/\s+/).filter(Boolean);
  if (palabras.length === 0) return "?";
  if (palabras.length === 1) return palabras[0].slice(0, 2).toUpperCase();
  return (palabras[0][0] + palabras[palabras.length - 1][0]).toUpperCase();
}

const ICONO_MODALIDAD: Record<string, typeof MapPin> = {
  Virtual: Video,
  Presencial: MapPin,
};

export function ConferencistaCard({ conferencia }: { conferencia: ConferenciaCard }) {
  const color = colorAvatar(conferencia.nombre);
  const esGrupo = conferencia.tipo === "Grupo";
  const IconoModalidad =
    Object.entries(ICONO_MODALIDAD).find(([clave]) => conferencia.modalidad.includes(clave))?.[1] ?? Video;

  return (
    <Card className="group relative gap-0 overflow-hidden py-0 shadow-sm transition-shadow hover:shadow-md">
      {/* "Retrato": avatar de iniciales con tinte de color derivado del nombre */}
      <div
        className="relative flex aspect-[4/3] items-center justify-center"
        style={{ background: `color-mix(in srgb, ${color} 16%, var(--card))` }}
      >
        <span
          className="flex size-24 items-center justify-center rounded-full text-3xl font-bold text-white shadow-md"
          style={{ backgroundColor: color }}
        >
          {esGrupo ? <Users className="size-10" aria-hidden /> : iniciales(conferencia.nombre)}
        </span>

        <span
          className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-card/90 px-2.5 py-1 text-[11px] font-medium text-foreground shadow-sm backdrop-blur"
          title={conferencia.modalidad}
        >
          <IconoModalidad className="size-3" aria-hidden />
          {conferencia.modalidad}
        </span>

        {esGrupo ? (
          <span className="absolute top-3 right-3 rounded-full bg-primary px-2.5 py-1 text-[11px] font-semibold text-primary-foreground shadow-sm">
            Grupo
          </span>
        ) : null}
      </div>

      {/* Contenido */}
      <div className="flex flex-1 flex-col gap-2.5 p-4">
        <div>
          <h3 className="text-[15px] leading-tight font-semibold text-foreground">{conferencia.nombre}</h3>
          <p className="mt-0.5 line-clamp-2 text-[12.5px] leading-snug text-muted-foreground">
            {conferencia.titulo}
          </p>
        </div>

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
          <p className="line-clamp-3 text-[12.5px] leading-relaxed text-muted-foreground">
            {conferencia.descripcion}
          </p>
        ) : null}

        <div className="mt-auto flex items-center justify-between gap-2 border-t border-border pt-3">
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
