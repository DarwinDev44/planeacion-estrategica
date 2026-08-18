import { NextResponse } from "next/server";
import { registrarUso } from "@/repositories/metricasRepository";
import { NAVEGACION } from "@/constants/navegacion";

/**
 * Recibe la actividad de uso desde el navegador y la suma a los contadores del
 * día. Necesariamente pública —la llama cualquier visitante—, así que no
 * devuelve nada ni acepta nada que no sea un incremento sobre una sección
 * conocida.
 *
 * El tablero que muestra estos números sí está detrás del PIN; esto solo
 * escribe.
 */
export const dynamic = "force-dynamic";

/**
 * Secciones que se pueden contabilizar. Es una lista blanca cerrada: sin ella,
 * cualquiera podría llenar la tabla de filas inventadas mandando rutas al azar,
 * y el tablero mostraría secciones que no existen.
 *
 * Sale de la navegación y de la portada, así que una sección nueva se
 * contabiliza sola en cuanto se agrega al menú, sin tocar este archivo. La
 * vista de administración queda fuera a propósito: es quien observa, no algo
 * que interese medir.
 */
const SECCIONES_VALIDAS = new Set(["/", ...NAVEGACION.map((item) => item.href)]);

/** Tope por petición: un cliente honesto nunca manda más, y acota el daño. */
const MAX_POR_PETICION = 500;

export async function POST(peticion: Request) {
  let cuerpo: unknown;
  try {
    cuerpo = await peticion.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const { seccion, visitas, sesiones, clics } = (cuerpo ?? {}) as Record<string, unknown>;

  if (typeof seccion !== "string" || !SECCIONES_VALIDAS.has(seccion)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const acotar = (valor: unknown) =>
    Math.min(MAX_POR_PETICION, Math.max(0, Math.trunc(Number(valor) || 0)));

  try {
    await registrarUso(seccion, {
      visitas: acotar(visitas),
      sesiones: acotar(sesiones),
      clics: acotar(clics),
    });
  } catch {
    // Que falle la métrica no debe notarse en la navegación: se responde
    // "recibido" igual, porque el cliente no puede hacer nada con el error y
    // reintentar solo duplicaría el conteo.
  }

  return NextResponse.json({ ok: true });
}
