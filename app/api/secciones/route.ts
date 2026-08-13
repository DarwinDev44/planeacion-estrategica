import { NextResponse } from "next/server";
import { estaSeccionPublicada } from "@/repositories/seccionesRepository";
import { SECCION_TRANSFORMACIONES } from "@/constants/secciones";

/**
 * Qué secciones condicionales están publicadas. Lo consulta el menú lateral,
 * que es un componente de cliente y vive en el layout compartido por todo el
 * panel: si el layout leyera la base directamente, las páginas del panel
 * —hoy estáticas— pasarían todas a renderizarse en cada visita.
 *
 * Es solo para pintar o no un enlace. El control de acceso real lo hace cada
 * página en el servidor, así que este endpoint no expone nada: dice si una
 * sección está publicada, que es justamente lo que cualquiera vería al entrar.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    [SECCION_TRANSFORMACIONES]: await estaSeccionPublicada(SECCION_TRANSFORMACIONES),
  });
}
