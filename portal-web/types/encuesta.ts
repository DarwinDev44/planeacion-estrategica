export type Rol =
  | "Estudiante"
  | "Graduado"
  | "Gestores del Conocimiento y el Aprendizaje"
  | "Administrativo"
  | "Ops-Apa";

export type Sede =
  | "Fusagasugá"
  | "Facatativá"
  | "Chía"
  | "Soacha"
  | "Ubaté"
  | "Girardot"
  | "Zipaquirá"
  | "Bogotá";

export type PreguntaId = "P1" | "P2" | "P3" | "P4";

export interface Persona {
  id: number;
  fechaInicio: string; // ISO 8601
  tipoParticipante: string;
  rolPrincipal: Rol;
  cantidadRoles: number;
  sede: Sede | null;
  facultad: string | null;
  programaOArea: string | null;
  fuenteUnidadRegional: string;
  esGraduado: boolean;
  esAdmin: boolean;
  esGca: boolean;
  esEstudiante: boolean;
  esOpsApa: boolean;
}

export interface RolAsignado {
  personaId: number;
  rol: Rol;
  cantidadRoles: number;
}

export interface RespuestaPregunta {
  personaId: number;
  preguntaId: PreguntaId;
  opcion: string;
  esOtro: boolean;
}

export interface PreguntaMeta {
  id: PreguntaId;
  texto: string;
  opciones: string[];
}

export interface FiltrosEncuesta {
  rol?: Rol[];
  sede?: Sede[];
  facultad?: string[];
  programaOArea?: string[];
  fechaDesde?: string;
  fechaHasta?: string;
}
