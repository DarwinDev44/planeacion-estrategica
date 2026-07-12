import "server-only";
import type { TablaMeta } from "@/types/metas";
import { getMetasDataSource } from "./datasource";

/**
 * Única capa de acceso a datos del módulo Metas. Los componentes nunca leen
 * el datasource directamente — igual que en `encuestaRepository.ts`.
 */
export function getTablasMetas(): TablaMeta[] {
  const ds = getMetasDataSource();
  return [
    {
      id: "gca",
      titulo: "Gestores del conocimiento",
      columnaEtiqueta: "Facultad",
      ordenColumnas: ["no", "si"],
      filas: ds.getGestoresConocimiento(),
    },
    {
      id: "administrativosContrato",
      titulo: "Administrativos OPS / APA",
      subtitulo: "Por tipo de contrato",
      columnaEtiqueta: "Etiquetas de fila",
      ordenColumnas: ["no", "si"],
      filas: ds.getAdministrativosPorContrato(),
    },
    {
      id: "administrativosSede",
      titulo: "Administrativos Planta / Término Fijo",
      subtitulo: "Por unidad regional",
      columnaEtiqueta: "Unidad regional",
      ordenColumnas: ["si", "no"],
      filas: ds.getAdministrativosPorSede(),
    },
    {
      id: "estudiantes",
      titulo: "Creador de oportunidad",
      columnaEtiqueta: "Programa",
      ordenColumnas: ["no", "si"],
      filas: ds.getCreadorOportunidad(),
    },
    {
      id: "graduados",
      titulo: "Graduados",
      columnaEtiqueta: "Programa",
      ordenColumnas: ["no", "si"],
      filas: ds.getGraduados(),
    },
  ];
}
