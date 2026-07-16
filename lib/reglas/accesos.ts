import type { AccesosCaiData, CorteAccesos, PersonaAcceso, RangoAcceso } from "@/types/accesos-cai";

/**
 * Reglas de negocio del módulo Accesos al CAI. Única definición de qué
 * significa "día de acceso" para el reporte: los rangos, el umbral de
 * atención, el orden de las personas y cómo se promedia.
 *
 * Vive en un módulo neutro (sin "server-only" ni "use client") a propósito: la
 * misma regla la aplican el origen de datos —al construir cada corte en el
 * servidor— y el panel —al consolidar la vista "Todas" en el cliente—. Antes
 * estaba duplicada literalmente en ambos, así que cambiar un umbral obligaba a
 * editar dos capas y arriesgaba que el gráfico y las tarjetas se contradijeran.
 */

/** A partir de estos días desde el último acceso, la persona requiere atención. */
export const UMBRAL_ATENCION_DIAS = 8;

/** Identidad del corte consolidado (vista "Todas") — también el valor del filtro. */
export const TODOS_LOS_CORTES = "todas";

/**
 * Rangos del reporte, en el orden en que se muestran. Los límites son
 * inclusivos y `null` significa "sin tope" por ese lado.
 *
 * El primer tramo queda abierto por abajo y el último por arriba a propósito:
 * así los rangos parten siempre a toda la población y su suma cuadra con
 * `personasUnicas`, incluso si el Excel llegara a traer un 0 o un valor
 * inesperado.
 */
const RANGOS: readonly { etiqueta: string; desde: number | null; hasta: number | null }[] = [
  { etiqueta: "0–1 día", desde: null, hasta: 1 },
  { etiqueta: "2–3 días", desde: 2, hasta: 3 },
  { etiqueta: "4–7 días", desde: 4, hasta: 7 },
  { etiqueta: `${UMBRAL_ATENCION_DIAS}+ días`, desde: UMBRAL_ATENCION_DIAS, hasta: null },
];

/** Cuántas personas caen en cada rango de días desde su último acceso. */
export function calcularRangos(personas: readonly PersonaAcceso[]): RangoAcceso[] {
  return RANGOS.map(({ etiqueta, desde, hasta }) => ({
    etiqueta,
    cantidad: personas.filter(
      (persona) =>
        (desde === null || persona.dias >= desde) && (hasta === null || persona.dias <= hasta)
    ).length,
  }));
}

/** Personas que llevan demasiados días sin acceder. */
export function personasQueRequierenAtencion(personas: readonly PersonaAcceso[]): PersonaAcceso[] {
  return personas.filter((persona) => persona.dias >= UMBRAL_ATENCION_DIAS);
}

/** Orden del reporte: primero quien lleva más días sin acceder; empate, alfabético. */
export function ordenarPersonas<T extends PersonaAcceso>(personas: readonly T[]): T[] {
  return [...personas].sort((a, b) => b.dias - a.dias || a.nombre.localeCompare(b.nombre, "es"));
}

/** Media de días redondeada a 2 decimales; 0 si no hay personas. */
export function promedioDias(personas: readonly PersonaAcceso[]): number {
  if (personas.length === 0) return 0;
  const suma = personas.reduce((total, persona) => total + persona.dias, 0);
  return redondear2(suma / personas.length);
}

/** Redondeo a 2 decimales, la precisión con que se reportan los accesos. */
export function redondear2(valor: number): number {
  return Math.round(valor * 100) / 100;
}

/**
 * Estado consolidado de cada persona (vista "Todas"): su medición más reciente.
 * Los cortes vienen ordenados por fecha, así que el último `set` de cada correo
 * gana.
 *
 * `promedioDias` se recalcula sobre esas personas y NO se reutiliza
 * `promedioGlobal`: ese promedia los cortes entre sí y describiría una
 * población distinta a la que resumen los rangos de esta misma vista, lo que
 * hacía que el indicador contradijera al gráfico de al lado.
 */
export function consolidarCortes(datos: AccesosCaiData): CorteAccesos {
  const personasPorCorreo = new Map<string, PersonaAcceso>();
  for (const corte of datos.cortes) {
    for (const persona of corte.personas) personasPorCorreo.set(persona.correo, persona);
  }

  const personas = ordenarPersonas([...personasPorCorreo.values()]);

  return {
    fecha: TODOS_LOS_CORTES,
    personasUnicas: personas.length,
    registros: datos.cortes.reduce((total, corte) => total + corte.registros, 0),
    promedioDias: promedioDias(personas),
    personas,
    rangos: calcularRangos(personas),
    variacionDias: null,
    variacionPorcentaje: null,
  };
}
