import { NextResponse } from "next/server";
import { getAreasDisponibles } from "@/repositories/encuestaRepository";

// Opciones de filtro derivadas en vivo del Excel (no varían con los demás
// filtros activos) — se sirven aparte para que el FilterBar (cliente) las
// pueda pedir una sola vez sin acoplarse al endpoint de resumen filtrado.
export async function GET() {
  return NextResponse.json({ areas: getAreasDisponibles() });
}
