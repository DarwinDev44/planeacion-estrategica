import { NextRequest, NextResponse } from "next/server";
import { getResumenFiltrado } from "@/repositories/encuestaRepository";
import type { FiltrosEncuesta } from "@/types/encuesta";

function parseLista(param: string | null): string[] | undefined {
  if (!param) return undefined;
  const valores = param.split(",").filter(Boolean);
  return valores.length ? valores : undefined;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const filtros: FiltrosEncuesta = {
    rol: parseLista(searchParams.get("rol")) as FiltrosEncuesta["rol"],
    sede: parseLista(searchParams.get("sede")) as FiltrosEncuesta["sede"],
    facultad: parseLista(searchParams.get("facultad")),
  };

  const resumen = getResumenFiltrado(filtros);
  return NextResponse.json(resumen);
}
