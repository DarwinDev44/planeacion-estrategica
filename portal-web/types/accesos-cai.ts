export interface PersonaAcceso {
  nombre: string;
  correo: string;
  dias: number;
}

export interface RangoAcceso {
  etiqueta: string;
  cantidad: number;
}

export interface CorteAccesos {
  fecha: string;
  personasUnicas: number;
  registros: number;
  promedioDias: number;
  personas: PersonaAcceso[];
  rangos: RangoAcceso[];
  variacionDias: number | null;
  variacionPorcentaje: number | null;
}

export interface AccesosCaiData {
  fuente: string;
  correoExcluido: string;
  correoExcluidoEncontrado: boolean;
  promedioGlobal: number;
  cortes: CorteAccesos[];
}
