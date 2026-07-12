import type { ValoracionConferencista } from "@/types/valoraciones";

export type TipoCardConferencista = "Grupo" | "Participante";

export interface ConferenciaCard {
  id: number;
  /** slug_participante del Excel — clave estable para cruzar con otras fuentes (p. ej. Valoraciones.xlsx). */
  slug: string;
  /** Nombre del conferencista o del grupo (p. ej. "Grupo Estratégico"). */
  nombre: string;
  /** Tema/título de la conferencia o jornada. */
  titulo: string;
  fecha: string;
  ubicacion: string;
  modalidad: string;
  descripcion: string;
  /** Enlace a la grabación/transmisión, si existe. */
  enlace: string | null;
  textoAlternativoImagen: string;
  orden: number;
  tipo: TipoCardConferencista;
  asistentesPresenciales: number | null;
  vistasRedesSociales: number | null;
  /** Cargo o rol destacado (p. ej. "Viceministro de Educación Superior de Colombia"). */
  tituloProfesional: string | null;
  formacionAcademica: string[];
  trayectoriaDestacada: string[];
  /** Ruta pública de la foto de perfil, o null si no hay una (cae al avatar de iniciales). */
  fotoUrl: string | null;
}

/**
 * ConferenciaCard con su valoración adjunta, resuelta server-side en
 * page.tsx (getValoracion vive en un repositorio "server-only" aparte —
 * Valoraciones.xlsx es una fuente independiente de Participación
 * jornadas.xlsx). null cuando no hay una valoración identificable con
 * confianza para esa persona (ver excel-valoraciones-source.ts).
 */
export interface ConferenciaConValoracion extends ConferenciaCard {
  valoracion: ValoracionConferencista | null;
}
