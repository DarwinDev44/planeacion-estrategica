import Image from "next/image";
import { Users } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ConferenciaCard } from "@/types/conferencistas";

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
  return (palabras[0][0] + palabras.at(-1)![0]).toUpperCase();
}

/**
 * Retrato reutilizable: foto circular cuando el Excel resolvió una (ver
 * `resolverFotoUrl` en el datasource), con el aro floral institucional
 * detrás — extraído de las presentaciones de perfil de los conferencistas y
 * usado como único activo decorativo compartido, en vez de uno distinto por
 * persona, para mantener una identidad visual consistente. Sin foto, cae al
 * avatar de iniciales con tinte determinístico ya usado en el resto del
 * proyecto.
 */
export function AvatarConferencista({
  conferencia,
  tamaño = 96,
  animado = true,
  prioridad = false,
}: {
  conferencia: ConferenciaCard;
  tamaño?: number;
  /** Balanceo idle del aro floral — apagado en contextos con muchas instancias a la vez si se prefiere. */
  animado?: boolean;
  prioridad?: boolean;
}) {
  const color = colorAvatar(conferencia.nombre);
  const esGrupo = conferencia.tipo === "Grupo";
  const tamañoFloral = Math.round(tamaño * 1.7);

  return (
    <div className="relative shrink-0" style={{ width: tamañoFloral, height: tamañoFloral }}>
      <div className={cn("absolute inset-0", animado && "animar-floral")}>
        <Image
          src="/conferencistas/decoracion/aro-floral.png"
          alt=""
          fill
          aria-hidden
          className="pointer-events-none object-contain select-none"
          sizes={`${tamañoFloral}px`}
        />
      </div>
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-full shadow-lg ring-4 ring-card transition-transform duration-300 ease-out group-hover:scale-[1.04]"
        style={{ width: tamaño, height: tamaño }}
      >
        {conferencia.fotoUrl ? (
          <Image
            src={conferencia.fotoUrl}
            alt={conferencia.textoAlternativoImagen || conferencia.nombre}
            fill
            priority={prioridad}
            className="object-cover"
            sizes={`${tamaño}px`}
          />
        ) : (
          <span
            className="flex size-full items-center justify-center font-bold text-white"
            style={{ backgroundColor: color, fontSize: tamaño * 0.32 }}
          >
            {esGrupo ? <Users style={{ width: tamaño * 0.4, height: tamaño * 0.4 }} aria-hidden /> : iniciales(conferencia.nombre)}
          </span>
        )}
      </div>
    </div>
  );
}
