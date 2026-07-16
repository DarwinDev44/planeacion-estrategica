import type { PreguntaMeta } from "@/types/encuesta";

/**
 * Opciones atómicas reales de las 4 preguntas de selección múltiple.
 * Extraídas y verificadas contra el Excel fuente (ver docs/01-analisis-funcional.md, §2.5).
 * Cualquier valor fuera de estas listas se clasifica como "Otro" (texto libre genuino).
 */
export const PREGUNTAS: PreguntaMeta[] = [
  {
    id: "P1",
    texto: "Un Plan Estratégico Universitario debe definir principalmente:",
    opciones: [
      "La visión y el rumbo institucional a largo plazo",
      "La relación con el entorno (territorio, estado, sector productivo, sociedad y en red con el mundo)",
      "Las prioridades estratégicas y grandes decisiones",
      "La transformación académica y tecnológica",
      "Los indicadores y metas institucionales",
      "Los recursos y la sostenibilidad financiera",
    ],
  },
  {
    id: "P2",
    texto: "¿Cómo consideras que debe construirse y desarrollarse la planeación institucional?",
    opciones: [
      "Primero se define el Plan Estratégico, luego el Plan de Desarrollo y finalmente los Planes de Acción",
      "Debe construirse de manera colaborativa y cocreativa con todas las partes interesadas",
      "Debe revisarse y ajustarse periódicamente según los cambios del entorno",
      "Debe partir de grandes decisiones institucionales y luego traducirse en proyectos concretos",
      "No tengo claridad sobre cómo funciona este proceso",
    ],
  },
  {
    id: "P3",
    texto: "Pensando en el futuro de la UCundinamarca, ¿cuáles decisiones estratégicas consideras debemos abordar?",
    opciones: [
      "Transformación digital y tecnologías emergentes",
      "Acreditación de alta calidad como aprendizaje institucional",
      "Persona transhumana frente al avance de la inteligencia artificial",
      "Relación con la sociedad, el Estado, el sector productivo y en red con el mundo.",
      "Sostenibilidad financiera de la universidad pública",
      "Formación para la vida, los valores democráticos, la civilidad y la libertad",
    ],
  },
  {
    id: "P4",
    texto: "En 10 años, ¿cómo te imaginas la UCundinamarca como universidad transmoderna y translocal?",
    opciones: [
      "Universidad referente en transformación digital y tecnologías emergentes",
      "Universidad que posiciona el pensamiento analítico, la persona transhumana y defiende la vida humana sostenible y en relación con los semejantes y el entorno.",
      "Universidad con fuerte impacto territorial y proyección translocal",
      "Universidad pública sostenible, autónoma y sólida",
      "Universidad que fortalece la formación para la vida, los valores democráticos, la civilidad y la libertad.",
    ],
  },
];

export function getPregunta(id: string): PreguntaMeta | undefined {
  return PREGUNTAS.find((p) => p.id === id);
}
