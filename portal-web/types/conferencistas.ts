export type TipoCardConferencista = "Grupo" | "Participante";

export interface ConferenciaCard {
  id: number;
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
}
