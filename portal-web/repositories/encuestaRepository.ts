import "server-only";
import type { AnalisisOtro, Persona, FiltrosEncuesta, PreguntaId } from "@/types/encuesta";
import { PREGUNTAS } from "@/constants/preguntas";
import {
  ASIGNACION_OTRO,
  CATEGORIAS_OTRO,
  CATEGORIA_RESIDUAL_OTRO,
  CONCLUSION_OTRO,
  claveRespuestaOtro,
} from "@/constants/analisis-otro";
import { getEncuestaDataSource } from "./datasource";
import { esRespuestaValida } from "@/lib/filtro-respuestas";

/**
 * Única capa de acceso a datos de la encuesta. Todo componente, página o
 * ruta de la aplicación consulta la información exclusivamente a través de
 * las funciones de este archivo — nunca lee el origen de datos directamente.
 * Internamente delega en `EncuestaDataSource` (hoy: los .xlsx en
 * data/source/, leídos en vivo — ver repositories/datasource/). Migrar a
 * otra fuente en el futuro no requiere tocar ninguna función de aquí, solo
 * la implementación detrás de `getEncuestaDataSource()`.
 */

const FILTROS_VACIOS: FiltrosEncuesta = {};

function personaCumpleFiltros(p: Persona, filtros: FiltrosEncuesta, rolesDePersona: Set<string>): boolean {
  if (filtros.rol?.length && !filtros.rol.some((r) => rolesDePersona.has(r))) return false;
  if (filtros.sede?.length && (!p.sede || !filtros.sede.includes(p.sede))) return false;
  if (filtros.facultad?.length && (!p.facultad || !filtros.facultad.includes(p.facultad))) return false;
  if (
    filtros.programaOArea?.length &&
    (!p.programaOArea || !filtros.programaOArea.includes(p.programaOArea))
  )
    return false;
  if (filtros.fechaDesde && p.fechaInicio < filtros.fechaDesde) return false;
  if (filtros.fechaHasta && p.fechaInicio > filtros.fechaHasta) return false;
  return true;
}

function construirMapaRolesPorPersona(): Map<number, Set<string>> {
  const mapa = new Map<number, Set<string>>();
  for (const r of getEncuestaDataSource().getRolesAsignados()) {
    const set = mapa.get(r.personaId) ?? new Set<string>();
    set.add(r.rol);
    mapa.set(r.personaId, set);
  }
  return mapa;
}

export function getPersonasFiltradas(filtros: FiltrosEncuesta = FILTROS_VACIOS): Persona[] {
  const rolesPorPersona = construirMapaRolesPorPersona();
  return getEncuestaDataSource()
    .getPersonas()
    .filter((p) => personaCumpleFiltros(p, filtros, rolesPorPersona.get(p.id) ?? new Set()));
}

export function getRankingPreguntaFiltrado(preguntaId: PreguntaId, filtros: FiltrosEncuesta = FILTROS_VACIOS) {
  const idsValidos = new Set(getPersonasFiltradas(filtros).map((p) => p.id));
  const pregunta = PREGUNTAS.find((p) => p.id === preguntaId);
  if (!pregunta) return [];

  const conteos = new Map<string, number>();
  for (const r of getEncuestaDataSource().getRespuestas()) {
    if (r.preguntaId !== preguntaId || r.esOtro) continue;
    if (!idsValidos.has(r.personaId)) continue;
    conteos.set(r.opcion, (conteos.get(r.opcion) ?? 0) + 1);
  }

  const total = idsValidos.size || 1;
  return pregunta.opciones
    .map((opcion) => ({
      opcion,
      conteo: conteos.get(opcion) ?? 0,
      porcentaje: Math.round(((conteos.get(opcion) ?? 0) / total) * 1000) / 10,
    }))
    .sort((a, b) => b.conteo - a.conteo);
}

export function getRankingPreguntasFiltrado(filtros: FiltrosEncuesta = FILTROS_VACIOS) {
  return {
    P1: getRankingPreguntaFiltrado("P1", filtros),
    P2: getRankingPreguntaFiltrado("P2", filtros),
    P3: getRankingPreguntaFiltrado("P3", filtros),
    P4: getRankingPreguntaFiltrado("P4", filtros),
  } as Record<PreguntaId, ReturnType<typeof getRankingPreguntaFiltrado>>;
}

export function getDistribucionRolFiltrada(filtros: FiltrosEncuesta = FILTROS_VACIOS): Record<string, number> {
  const idsValidos = new Set(getPersonasFiltradas(filtros).map((p) => p.id));
  const out: Record<string, number> = {};
  for (const r of getEncuestaDataSource().getRolesAsignados()) {
    if (!idsValidos.has(r.personaId)) continue;
    out[r.rol] = (out[r.rol] ?? 0) + 1;
  }
  return out;
}

export function getDistribucionSedeFiltrada(filtros: FiltrosEncuesta = FILTROS_VACIOS): Record<string, number> {
  const out: Record<string, number> = {};
  for (const p of getPersonasFiltradas(filtros)) {
    if (!p.sede) continue;
    out[p.sede] = (out[p.sede] ?? 0) + 1;
  }
  return out;
}

export function getSerieTiempoFiltrada(filtros: FiltrosEncuesta = FILTROS_VACIOS): { fecha: string; conteo: number }[] {
  const map = new Map<string, number>();
  for (const p of getPersonasFiltradas(filtros)) {
    const dia = p.fechaInicio.slice(0, 10);
    map.set(dia, (map.get(dia) ?? 0) + 1);
  }
  return [...map.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([fecha, conteo]) => ({ fecha, conteo }));
}

export function getKpisFiltrados(filtros: FiltrosEncuesta = FILTROS_VACIOS) {
  const personas = getPersonasFiltradas(filtros);
  const rolesPorPersona = construirMapaRolesPorPersona();
  const ids = new Set(personas.map((p) => p.id));
  let totalAsignacionesRol = 0;
  let personasConMultiRol = 0;
  for (const [id, roles] of rolesPorPersona) {
    if (!ids.has(id)) continue;
    totalAsignacionesRol += roles.size;
    if (roles.size > 1) personasConMultiRol += 1;
  }
  return {
    totalParticipantes: personas.length,
    totalAsignacionesRol,
    sedesConParticipacion: new Set(personas.map((p) => p.sede).filter(Boolean)).size,
    programasRepresentados: new Set(personas.map((p) => p.programaOArea).filter(Boolean)).size,
    personasConMultiRol,
  };
}

/** Bundle único para las vistas interactivas (evita N round-trips al cambiar filtros). */
export function getResumenFiltrado(filtros: FiltrosEncuesta = FILTROS_VACIOS) {
  return {
    kpis: getKpisFiltrados(filtros),
    distribucionRol: getDistribucionRolFiltrada(filtros),
    distribucionSede: getDistribucionSedeFiltrada(filtros),
    rankingPreguntas: getRankingPreguntasFiltrado(filtros),
    serieTiempo: getSerieTiempoFiltrada(filtros),
  };
}

// ---------- Alias "sin filtros" (vista por defecto de cada página) ----------

export const getKpisEjecutivos = () => getKpisFiltrados();
export const getDistribucionRolPreagregada = () => getDistribucionRolFiltrada();
export const getDistribucionSedePreagregada = () => getDistribucionSedeFiltrada();
export const getRankingPreguntasPreagregado = () => getRankingPreguntasFiltrado();
export const getSerieTiempoPreagregada = () => getSerieTiempoFiltrada();

export function getRespuestasOtroPreagregadas(): { personaId: number; preguntaId: PreguntaId; texto: string }[] {
  return getEncuestaDataSource()
    .getRespuestas()
    .filter((r) => r.esOtro && esRespuestaValida(r.opcion))
    .map((r) => ({ personaId: r.personaId, preguntaId: r.preguntaId, texto: r.opcion }));
}

/**
 * Categorización temática de las respuestas abiertas ("Otro") + conclusión.
 * Cada respuesta viva del Excel se busca en ASIGNACION_OTRO (asignación
 * cualitativa hecha respuesta por respuesta); las que no estén en el mapa
 * (nuevas o editadas) caen en la categoría residual, así los conteos siempre
 * suman el total real.
 */
export function getAnalisisOtroPreagregado(): AnalisisOtro {
  const respuestas = getRespuestasOtroPreagregadas();
  const conteos = new Map<string, number>();
  for (const r of respuestas) {
    const categoria = ASIGNACION_OTRO[claveRespuestaOtro(r.personaId, r.preguntaId, r.texto)] ?? CATEGORIA_RESIDUAL_OTRO;
    conteos.set(categoria, (conteos.get(categoria) ?? 0) + 1);
  }
  const total = respuestas.length;
  return {
    total,
    categorias: CATEGORIAS_OTRO.map((c) => {
      const conteo = conteos.get(c.id) ?? 0;
      return { ...c, conteo, porcentaje: total > 0 ? (conteo / total) * 100 : 0 };
    }),
    conclusion: CONCLUSION_OTRO,
  };
}

export function getCombinacionesRolPreagregadas(): { combinacion: string; conteo: number }[] {
  const rolesPorPersona = new Map<number, string[]>();
  for (const r of getEncuestaDataSource().getRolesAsignados()) {
    const arr = rolesPorPersona.get(r.personaId) ?? [];
    arr.push(r.rol);
    rolesPorPersona.set(r.personaId, arr);
  }
  const combinaciones = new Map<string, number>();
  for (const roles of rolesPorPersona.values()) {
    if (roles.length < 2) continue;
    const key = [...roles].sort().join(" + ");
    combinaciones.set(key, (combinaciones.get(key) ?? 0) + 1);
  }
  return [...combinaciones.entries()]
    .map(([combinacion, conteo]) => ({ combinacion, conteo }))
    .sort((a, b) => b.conteo - a.conteo);
}

export function getFacultadesDisponibles(): string[] {
  const set = new Set<string>();
  for (const p of getEncuestaDataSource().getPersonas()) if (p.facultad) set.add(p.facultad);
  return [...set].sort((a, b) => a.localeCompare(b, "es"));
}

// Quita diacríticos por código de punto (evita depender de un escape
// \uXXXX en el literal de una regex) — mismo criterio que en
// lib/filtro-respuestas.ts.
function normalizarParaAgrupar(texto: string): string {
  return Array.from(texto.trim().toUpperCase().normalize("NFD"))
    .filter((c) => {
      const codigo = c.codePointAt(0) ?? 0;
      return codigo < 0x0300 || codigo > 0x036f;
    })
    .join("")
    .replace(/\s+/g, " ");
}

/**
 * Áreas administrativas (no académicas): personas cuyo "Programa o Area" del
 * Excel no resolvió a ninguna Facultad (ver AREA_A_FACULTAD y el diccionario
 * Programa→Facultad en el datasource). Como el texto de origen tiene
 * variantes con/sin tilde para una misma área (p.ej. "Direccion De Talento
 * Humano" vs "Dirección De Talento Humano"), se agrupan por texto
 * normalizado y se muestra la variante escrita con más frecuencia.
 */
export function getAreasDisponibles(): string[] {
  const conteoPorVariante = new Map<string, number>();
  for (const p of getEncuestaDataSource().getPersonas()) {
    if (p.facultad || !p.programaOArea) continue;
    const texto = p.programaOArea.trim();
    conteoPorVariante.set(texto, (conteoPorVariante.get(texto) ?? 0) + 1);
  }

  const mejorVariantePorGrupo = new Map<string, { etiqueta: string; conteo: number }>();
  for (const [variante, conteo] of conteoPorVariante) {
    const clave = normalizarParaAgrupar(variante);
    const actual = mejorVariantePorGrupo.get(clave);
    if (!actual || conteo > actual.conteo) {
      mejorVariantePorGrupo.set(clave, { etiqueta: variante, conteo });
    }
  }

  return [...mejorVariantePorGrupo.values()]
    .map((v) => v.etiqueta)
    .sort((a, b) => a.localeCompare(b, "es"));
}

export function getProgramasDisponibles(): string[] {
  const set = new Set<string>();
  for (const p of getEncuestaDataSource().getPersonas()) if (p.programaOArea) set.add(p.programaOArea);
  return [...set].sort((a, b) => a.localeCompare(b, "es"));
}

export function getConteoPorFacultad(): { facultad: string; conteo: number }[] {
  const out = new Map<string, number>();
  for (const p of getEncuestaDataSource().getPersonas()) {
    if (!p.facultad) continue;
    out.set(p.facultad, (out.get(p.facultad) ?? 0) + 1);
  }
  return [...out.entries()].map(([facultad, conteo]) => ({ facultad, conteo })).sort((a, b) => b.conteo - a.conteo);
}

