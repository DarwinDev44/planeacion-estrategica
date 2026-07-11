import type { Metadata } from "next";
import { ParticipacionClient } from "@/components/dashboard/participacion-client";
import {
  getKpisEjecutivos,
  getDistribucionRolPreagregada,
  getDistribucionSedePreagregada,
  getRankingPreguntasPreagregado,
  getSerieTiempoPreagregada,
  getCombinacionesRolPreagregadas,
  getConteoPorFacultad,
} from "@/repositories/encuestaRepository";

export const metadata: Metadata = { title: "Quién participó, encuesta tu voz fundamental" };

export default function ParticipacionPage() {
  const inicial = {
    kpis: getKpisEjecutivos(),
    distribucionRol: getDistribucionRolPreagregada(),
    distribucionSede: getDistribucionSedePreagregada(),
    rankingPreguntas: getRankingPreguntasPreagregado(),
    serieTiempo: getSerieTiempoPreagregada(),
  };
  const estatico = {
    combinaciones: getCombinacionesRolPreagregadas(),
    conteoFacultad: getConteoPorFacultad(),
  };

  return <ParticipacionClient inicial={inicial} estatico={estatico} />;
}
