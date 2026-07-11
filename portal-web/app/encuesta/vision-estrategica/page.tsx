import type { Metadata } from "next";
import { VisionEstrategicaClient } from "@/components/dashboard/vision-estrategica-client";
import {
  getKpisEjecutivos,
  getDistribucionRolPreagregada,
  getDistribucionSedePreagregada,
  getRankingPreguntasPreagregado,
  getSerieTiempoPreagregada,
  getRespuestasOtroPreagregadas,
} from "@/repositories/encuestaRepository";

export const metadata: Metadata = { title: "Visión estratégica" };

export default function VisionEstrategicaPage() {
  const inicial = {
    kpis: getKpisEjecutivos(),
    distribucionRol: getDistribucionRolPreagregada(),
    distribucionSede: getDistribucionSedePreagregada(),
    rankingPreguntas: getRankingPreguntasPreagregado(),
    serieTiempo: getSerieTiempoPreagregada(),
  };

  return (
    <VisionEstrategicaClient inicial={inicial} respuestasOtro={getRespuestasOtroPreagregadas()} />
  );
}
