import "server-only";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type {
  Persona,
  RolAsignado,
  RespuestaPregunta,
  FiltrosEncuesta,
  PreguntaId,
} from "@/types/encuesta";
import { PREGUNTAS } from "@/constants/preguntas";

const DATA_DIR = join(process.cwd(), "data");
const AGG_DIR = join(DATA_DIR, "agregados");

function readJSON<T>(...segments: string[]): T {
  return JSON.parse(readFileSync(join(...segments), "utf-8")) as T;
}

// Cache en memoria por proceso — los JSON son estáticos (snapshot de encuesta cerrada).
let _personas: Persona[] | null = null;
let _rolesAsignados: RolAsignado[] | null = null;
let _respuestas: RespuestaPregunta[] | null = null;

function getPersonasRaw(): Persona[] {
  if (!_personas) _personas = readJSON<Persona[]>(DATA_DIR, "personas.json");
  return _personas;
}
function getRolesAsignadosRaw(): RolAsignado[] {
  if (!_rolesAsignados) _rolesAsignados = readJSON<RolAsignado[]>(DATA_DIR, "roles-asignados.json");
  return _rolesAsignados;
}
function getRespuestasRaw(): RespuestaPregunta[] {
  if (!_respuestas) _respuestas = readJSON<RespuestaPregunta[]>(DATA_DIR, "respuestas.json");
  return _respuestas;
}

// ---------- Vista sin filtros (agregados pre-calculados en build-time) ----------

export function getKpisEjecutivos() {
  return readJSON<{
    totalParticipantes: number;
    totalAsignacionesRol: number;
    sedesConParticipacion: number;
    programasRepresentados: number;
    personasConMultiRol: number;
    ventanaTemporal: { desde: string | null; hasta: string | null };
  }>(AGG_DIR, "kpis.json");
}

export function getDistribucionRolPreagregada() {
  return readJSON<Record<string, number>>(AGG_DIR, "distribucion-rol.json");
}

export function getDistribucionSedePreagregada() {
  return readJSON<Record<string, number>>(AGG_DIR, "distribucion-sede.json");
}

export function getRankingPreguntasPreagregado() {
  return readJSON<
    Record<PreguntaId, { opcion: string; conteo: number; porcentaje: number }[]>
  >(AGG_DIR, "ranking-preguntas.json");
}

export function getRespuestasOtroPreagregadas() {
  return readJSON<{ personaId: number; preguntaId: PreguntaId; texto: string }[]>(
    AGG_DIR,
    "respuestas-otro.json"
  );
}

export function getSerieTiempoPreagregada() {
  return readJSON<{ fecha: string; conteo: number }[]>(AGG_DIR, "serie-tiempo.json");
}

export function getCombinacionesRolPreagregadas() {
  return readJSON<{ combinacion: string; conteo: number }[]>(AGG_DIR, "combinaciones-rol.json");
}

// ---------- Consultas filtrables (para las rutas API de cross-filtering) ----------

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
  for (const r of getRolesAsignadosRaw()) {
    const set = mapa.get(r.personaId) ?? new Set<string>();
    set.add(r.rol);
    mapa.set(r.personaId, set);
  }
  return mapa;
}

export function getPersonasFiltradas(filtros: FiltrosEncuesta): Persona[] {
  const rolesPorPersona = construirMapaRolesPorPersona();
  return getPersonasRaw().filter((p) =>
    personaCumpleFiltros(p, filtros, rolesPorPersona.get(p.id) ?? new Set())
  );
}

export function getRankingPreguntaFiltrado(preguntaId: PreguntaId, filtros: FiltrosEncuesta) {
  const idsValidos = new Set(getPersonasFiltradas(filtros).map((p) => p.id));
  const pregunta = PREGUNTAS.find((p) => p.id === preguntaId);
  if (!pregunta) return [];

  const conteos = new Map<string, number>();
  for (const r of getRespuestasRaw()) {
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

export function getDistribucionRolFiltrada(filtros: FiltrosEncuesta): Record<string, number> {
  const idsValidos = new Set(getPersonasFiltradas(filtros).map((p) => p.id));
  const out: Record<string, number> = {};
  for (const r of getRolesAsignadosRaw()) {
    if (!idsValidos.has(r.personaId)) continue;
    out[r.rol] = (out[r.rol] ?? 0) + 1;
  }
  return out;
}

export function getDistribucionSedeFiltrada(filtros: FiltrosEncuesta): Record<string, number> {
  const out: Record<string, number> = {};
  for (const p of getPersonasFiltradas(filtros)) {
    if (!p.sede) continue;
    out[p.sede] = (out[p.sede] ?? 0) + 1;
  }
  return out;
}

/**
 * Matriz de coherencia entre dos preguntas: para cada combinación de las top-N
 * opciones de A y B, el % de personas que seleccionó la opción de B *dado que*
 * seleccionó la opción de A (P(B|A)). Usada para el cruce P3<->P4.
 */
export function getMatrizCruce(preguntaA: PreguntaId, preguntaB: PreguntaId, topN = 3) {
  const respuestas = getRespuestasRaw();
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
  for (const p of getPersonasRaw()) if (p.facultad) set.add(p.facultad);
  return [...set].sort((a, b) => a.localeCompare(b, "es"));
}

export function getProgramasDisponibles(): string[] {
  const set = new Set<string>();
  for (const p of getPersonasRaw()) if (p.programaOArea) set.add(p.programaOArea);
  return [...set].sort((a, b) => a.localeCompare(b, "es"));
}

export function getConteoPorFacultad(): { facultad: string; conteo: number }[] {
  const out = new Map<string, number>();
  for (const p of getPersonasRaw()) {
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
  return getPersonasRaw().map((p) => ({
    id: p.id,
    rolPrincipal: p.rolPrincipal,
    sede: p.sede,
    facultad: p.facultad,
    programaOArea: p.programaOArea,
    cantidadRoles: p.cantidadRoles,
    fechaInicio: p.fechaInicio,
  }));
}
