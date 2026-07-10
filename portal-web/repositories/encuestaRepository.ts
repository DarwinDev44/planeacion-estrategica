import "server-only";
import type { Persona, FiltrosEncuesta, PreguntaId } from "@/types/encuesta";
import { PREGUNTAS } from "@/constants/preguntas";
import { getEncuestaDataSource } from "./datasource";

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
    .filter((r) => r.esOtro)
    .map((r) => ({ personaId: r.personaId, preguntaId: r.preguntaId, texto: r.opcion }));
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

/**
 * Matriz de coherencia entre dos preguntas: para cada combinación de las top-N
 * opciones de A y B, el % de personas que seleccionó la opción de B *dado que*
 * seleccionó la opción de A (P(B|A)). Usada para el cruce P3<->P4.
 */
export function getMatrizCruce(preguntaA: PreguntaId, preguntaB: PreguntaId, topN = 3) {
  const respuestas = getEncuestaDataSource().getRespuestas();
  const porPersonaA = new Map<number, Set<string>>();
  const porPersonaB = new Map<number, Set<string>>();
  const conteoA = new Map<string, number>();
  const conteoB = new Map<string, number>();

  for (const r of respuestas) {
    if (r.esOtro) continue;
    if (r.preguntaId === preguntaA) {
      conteoA.set(r.opcion, (conteoA.get(r.opcion) ?? 0) + 1);
      const set = porPersonaA.get(r.personaId) ?? new Set<string>();
      set.add(r.opcion);
      porPersonaA.set(r.personaId, set);
    }
    if (r.preguntaId === preguntaB) {
      conteoB.set(r.opcion, (conteoB.get(r.opcion) ?? 0) + 1);
      const set = porPersonaB.get(r.personaId) ?? new Set<string>();
      set.add(r.opcion);
      porPersonaB.set(r.personaId, set);
    }
  }

  const topA = [...conteoA.entries()].sort((a, b) => b[1] - a[1]).slice(0, topN).map(([o]) => o);
  const topB = [...conteoB.entries()].sort((a, b) => b[1] - a[1]).slice(0, topN).map(([o]) => o);

  const filas = topA.map((opcionA) => {
    const personasConA = [...porPersonaA.entries()].filter(([, set]) => set.has(opcionA)).map(([id]) => id);
    const totalA = personasConA.length || 1;
    const celdas = topB.map((opcionB) => {
      const coinciden = personasConA.filter((id) => porPersonaB.get(id)?.has(opcionB)).length;
      return { opcionB, porcentaje: Math.round((coinciden / totalA) * 1000) / 10 };
    });
    return { opcionA, celdas };
  });

  return { topB, filas };
}

export function getFacultadesDisponibles(): string[] {
  const set = new Set<string>();
  for (const p of getEncuestaDataSource().getPersonas()) if (p.facultad) set.add(p.facultad);
  return [...set].sort((a, b) => a.localeCompare(b, "es"));
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

export interface FilaExploracion {
  id: number;
  rolPrincipal: string;
  sede: string | null;
  facultad: string | null;
  programaOArea: string | null;
  cantidadRoles: number;
  fechaInicio: string;
}

export function getFilasExploracion(): FilaExploracion[] {
  return getEncuestaDataSource()
    .getPersonas()
    .map((p) => ({
      id: p.id,
      rolPrincipal: p.rolPrincipal,
      sede: p.sede,
      facultad: p.facultad,
      programaOArea: p.programaOArea,
      cantidadRoles: p.cantidadRoles,
      fechaInicio: p.fechaInicio,
    }));
}
