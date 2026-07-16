import type { CaiData, EstadoActividad } from "@/types/cai";

/** Un participante es reincidente si tiene 2 o más actividades sin finalizar. */
export const UMBRAL_REINCIDENCIA = 2;

export interface ParticipanteResumen {
  nombre: string;
  correo: string;
  /** Estado por actividad, en el mismo orden que datos.actividades */
  estados: EstadoActividad[];
  finalizadas: number;
  pendientes: number;
  porcentajeFinalizacion: number;
  reincidente: boolean;
}

export interface ResumenParticipantes {
  participantes: ParticipanteResumen[];
  reincidentes: number;
  noReincidentes: number;
  porcentajeReincidentes: number;
  porcentajeNoReincidentes: number;
}

const redondear1 = (n: number) => Math.round(n * 10) / 10;

/** Pivota el JSON (centrado en actividades) a una vista por participante. */
export function derivarParticipantes(datos: CaiData): ResumenParticipantes {
  const porCorreo = new Map<string, ParticipanteResumen>();
  const totalActividades = datos.actividades.length;

  datos.actividades.forEach((actividad, indice) => {
    for (const p of actividad.participantes) {
      let resumen = porCorreo.get(p.correo);
      if (!resumen) {
        resumen = {
          nombre: p.nombre,
          correo: p.correo,
          estados: new Array<EstadoActividad>(totalActividades).fill("Finalizado"),
          finalizadas: 0,
          pendientes: 0,
          porcentajeFinalizacion: 0,
          reincidente: false,
        };
        porCorreo.set(p.correo, resumen);
      }
      resumen.estados[indice] = p.estado;
    }
  });

  const participantes = [...porCorreo.values()];
  for (const r of participantes) {
    r.pendientes = r.estados.filter((e) => e === "No finalizado").length;
    r.finalizadas = totalActividades - r.pendientes;
    r.porcentajeFinalizacion = redondear1((r.finalizadas / totalActividades) * 100);
    r.reincidente = r.pendientes >= UMBRAL_REINCIDENCIA;
  }

  // Los casos con más pendientes primero; luego alfabético
  participantes.sort(
    (a, b) => b.pendientes - a.pendientes || a.nombre.localeCompare(b.nombre, "es")
  );

  const reincidentes = participantes.filter((p) => p.reincidente).length;
  const total = participantes.length;

  return {
    participantes,
    reincidentes,
    noReincidentes: total - reincidentes,
    porcentajeReincidentes: total ? redondear1((reincidentes / total) * 100) : 0,
    porcentajeNoReincidentes: total ? redondear1(((total - reincidentes) / total) * 100) : 0,
  };
}

/** Número legible de la actividad a partir del id: m3-a4-2 → "Actividad 4.2"; null para Aceptación PAD */
export function numeroActividad(id: string): string | null {
  if (!id.startsWith("m")) return null;
  const parte = id.split("-a")[1];
  return parte ? `Actividad ${parte.replace(/-/g, ".")}` : null;
}
