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

/**
 * Contrato de datos — Accesos a CAI Planeación estratégica.
 * Derivado en vivo de data/source-cai/Accesos a CAI Planeación estratégica.xlsx
 * (ver repositories/datasource/excel-accesos-source.ts).
 */
export interface AccesosCaiData {
  /** Nombre del archivo fuente */
  fuente: string;
  promedioGlobal: number;
  cortes: CorteAccesos[];
}
