import type { Metadata } from "next";
import { PreguntasEstrategicasClient } from "@/components/dashboard/preguntas-estrategicas-client";
import {
  getKpisEjecutivos,
  getDistribucionRolPreagregada,
  getDistribucionSedePreagregada,
  getRankingPreguntasPreagregado,
  getSerieTiempoPreagregada,
  getRespuestasOtroPreagregadas,
  getAnalisisOtroPreagregado,
} from "@/repositories/encuestaRepository";

export const metadata: Metadata = { title: "Visión estratégica — Diagnóstico: Tu Voz Fundamental" };

export default function VisionEstrategicaPage() {
  const inicial = {
    kpis: getKpisEjecutivos(),
    distribucionRol: getDistribucionRolPreagregada(),
    distribucionSede: getDistribucionSedePreagregada(),
    rankingPreguntas: getRankingPreguntasPreagregado(),
    serieTiempo: getSerieTiempoPreagregada(),
  };

  return (
    <PreguntasEstrategicasClient
      titulo="Visión estratégica — Diagnóstico: Tu Voz Fundamental"
      descripcion="Decisiones estratégicas a futuro y la visión de la UCundinamarca a 10 años"
      preguntasIds={["P3", "P4"]}
      inicial={inicial}
      respuestasOtro={getRespuestasOtroPreagregadas()}
      analisisOtro={getAnalisisOtroPreagregado()}
    />
  );
}
