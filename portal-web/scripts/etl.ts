/**
 * ETL: transforma los .xlsx fuente en JSON normalizado + agregados pre-calculados.
 *
 * Fuente: data-source/*.xlsx (no versionado, ver .gitignore)
 * Salida: data/*.json (versionado, consumido por repositories/)
 *
 * Decisión de alcance documentada (ver docs/02-investigacion-arquitectura.md):
 * el archivo principal repite Sede/Facultad/Programa hasta en 4 bloques posicionales
 * (uno por rol adicional), pero no existe una columna que declare explícitamente a
 * qué rol pertenece cada bloque para una persona con multi-rol. Reconstruir esa
 * asociación a ciegas produciría cruces falsos. Por eso la geografía (sede/facultad/
 * programa) se toma de las columnas resumen "Unidad Regional" / "Programa o Area"
 * (ligadas al Rol principal, 0% nulas), y el conteo de roles reales viene de
 * IDXROLES.xlsx (ya normalizado, fuente de verdad para "cuántos roles y cuáles").
 * La tabla Facultad se deriva de un diccionario Programa→Facultad construido a
 * partir de los propios bloques (que sí traen ambos valores juntos).
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import * as XLSX from "xlsx";
import { PREGUNTAS } from "../constants/preguntas";
import type {
  Persona,
  RolAsignado,
  RespuestaPregunta,
  PreguntaId,
  Sede,
  Rol,
} from "../types/encuesta";

const ROOT = join(__dirname, "..");
const SRC = join(ROOT, "data-source");
const OUT = join(ROOT, "data");
const OUT_AGG = join(OUT, "agregados");

for (const dir of [OUT, OUT_AGG]) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

function normalizar(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toUpperCase();
}

function excelSerialToISO(serial: number): string {
  const EPOCH_MS = Date.UTC(1899, 11, 30);
  const ms = EPOCH_MS + Math.round(serial * 86400) * 1000;
  return new Date(ms).toISOString();
}

function readSheet(fileName: string): unknown[][] {
  const wb = XLSX.readFile(join(SRC, fileName));
  const sheet = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true, defval: null }) as unknown[][];
}

// ---------- 1. IDXROLES.xlsx -> rolesAsignados ----------
const idxRows = readSheet("IDXROLES.xlsx");
idxRows.shift(); // header
const rolesAsignados: RolAsignado[] = idxRows
  .filter((r) => r[0] != null)
  .map((r) => ({
    personaId: Number(r[0]),
    rol: String(r[1]) as Rol,
    cantidadRoles: Number(r[2]),
  }));

// ---------- 2. Archivo principal ----------
const rows = readSheet("Participación tu voz es fundamental.xlsx");
rows.shift(); // header

// idx (0-based) de cada bloque Sede/Facultad/Programa x8, para construir el diccionario Programa->Facultad
const BLOQUES = [
  { sede: 12, facultad: 13, programas: [14, 15, 16, 17, 18, 19, 20, 21] },
  { sede: 22, facultad: 23, programas: [24, 25, 26, 27, 28, 29, 30, 31] },
  { sede: 32, facultad: 33, programas: [34, 35, 36, 37, 38, 39, 40, 41] },
];

const programaAFacultad = new Map<string, string>();
for (const row of rows) {
  for (const bloque of BLOQUES) {
    const facultad = row[bloque.facultad] as string | null;
    if (!facultad) continue;
    for (const pIdx of bloque.programas) {
      const programa = row[pIdx] as string | null;
      if (programa) programaAFacultad.set(normalizar(programa), facultad);
    }
  }
}

const personas: Persona[] = [];
const respuestas: RespuestaPregunta[] = [];

const PREGUNTA_COL: Record<PreguntaId, number> = { P1: 44, P2: 45, P3: 46, P4: 47 };
const OPCIONES_POR_PREGUNTA: Record<PreguntaId, Set<string>> = PREGUNTAS.reduce(
  (acc, p) => ({ ...acc, [p.id]: new Set(p.opciones) }),
  {} as Record<PreguntaId, Set<string>>
);

for (const row of rows) {
  const id = row[0];
  if (id == null) continue;

  const sedeRaw = row[8] as string | null;
  const programaOArea = row[10] as string | null;
  const facultad = programaOArea
    ? programaAFacultad.get(normalizar(programaOArea)) ?? null
    : null;

  personas.push({
    id: Number(id),
    fechaInicio: typeof row[1] === "number" ? excelSerialToISO(row[1]) : new Date(0).toISOString(),
    tipoParticipante: String(row[5] ?? ""),
    rolPrincipal: String(row[6]) as Rol,
    cantidadRoles: Number(row[7]),
    sede: (sedeRaw as Sede) ?? null,
    facultad,
    programaOArea,
    fuenteUnidadRegional: String(row[9] ?? ""),
    esGraduado: row[48] === "SI",
    esAdmin: row[49] === "SI",
    esGca: row[50] === "SI",
    esEstudiante: row[51] === "SI",
    esOpsApa: row[52] === "SI",
  });

  for (const preguntaId of Object.keys(PREGUNTA_COL) as PreguntaId[]) {
    const raw = row[PREGUNTA_COL[preguntaId]] as string | null;
    if (!raw) continue;
    const opciones = raw
      .split(";")
      .map((s) => s.trim())
      .filter(Boolean);
    for (const opcion of opciones) {
      respuestas.push({
        personaId: Number(id),
        preguntaId,
        opcion,
        esOtro: !OPCIONES_POR_PREGUNTA[preguntaId].has(opcion),
      });
    }
  }
}

writeFileSync(join(OUT, "personas.json"), JSON.stringify(personas));
writeFileSync(join(OUT, "roles-asignados.json"), JSON.stringify(rolesAsignados));
writeFileSync(join(OUT, "respuestas.json"), JSON.stringify(respuestas));

// ---------- 3. Agregados pre-calculados (vista sin filtros) ----------

function contarPor<T>(items: T[], key: (item: T) => string): Record<string, number> {
  const out: Record<string, number> = {};
  for (const item of items) {
    const k = key(item);
    out[k] = (out[k] ?? 0) + 1;
  }
  return out;
}

const distribucionRol = contarPor(rolesAsignados, (r) => r.rol);

const distribucionSede = contarPor(
  personas.filter((p) => p.sede),
  (p) => p.sede as string
);

const rankingPreguntas: Record<PreguntaId, { opcion: string; conteo: number; porcentaje: number }[]> =
  {} as never;
const totalPersonas = personas.length;
for (const pregunta of PREGUNTAS) {
  const conteos = contarPor(
    respuestas.filter((r) => r.preguntaId === pregunta.id && !r.esOtro),
    (r) => r.opcion
  );
  rankingPreguntas[pregunta.id] = pregunta.opciones
    .map((opcion) => ({
      opcion,
      conteo: conteos[opcion] ?? 0,
      porcentaje: Math.round(((conteos[opcion] ?? 0) / totalPersonas) * 1000) / 10,
    }))
    .sort((a, b) => b.conteo - a.conteo);
}

const respuestasOtro = respuestas
  .filter((r) => r.esOtro)
  .map((r) => ({ personaId: r.personaId, preguntaId: r.preguntaId, texto: r.opcion }));

// Series de tiempo: conteo de respuestas por día (ISO date)
const serieTiempoMap = new Map<string, number>();
for (const p of personas) {
  const dia = p.fechaInicio.slice(0, 10);
  serieTiempoMap.set(dia, (serieTiempoMap.get(dia) ?? 0) + 1);
}
const serieTiempo = [...serieTiempoMap.entries()]
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([fecha, conteo]) => ({ fecha, conteo }));

// Combinaciones de multi-rol
const rolesPorPersona = new Map<number, string[]>();
for (const r of rolesAsignados) {
  const arr = rolesPorPersona.get(r.personaId) ?? [];
  arr.push(r.rol);
  rolesPorPersona.set(r.personaId, arr);
}
const combinacionesMap = new Map<string, number>();
for (const roles of rolesPorPersona.values()) {
  if (roles.length < 2) continue;
  const key = [...roles].sort().join(" + ");
  combinacionesMap.set(key, (combinacionesMap.get(key) ?? 0) + 1);
}
const combinacionesRol = [...combinacionesMap.entries()]
  .map(([combinacion, conteo]) => ({ combinacion, conteo }))
  .sort((a, b) => b.conteo - a.conteo);

const kpis = {
  totalParticipantes: totalPersonas,
  totalAsignacionesRol: rolesAsignados.length,
  sedesConParticipacion: Object.keys(distribucionSede).length,
  programasRepresentados: new Set(personas.map((p) => p.programaOArea).filter(Boolean)).size,
  personasConMultiRol: [...rolesPorPersona.values()].filter((r) => r.length > 1).length,
  ventanaTemporal: {
    desde: serieTiempo[0]?.fecha ?? null,
    hasta: serieTiempo[serieTiempo.length - 1]?.fecha ?? null,
  },
};

writeFileSync(join(OUT_AGG, "distribucion-rol.json"), JSON.stringify(distribucionRol));
writeFileSync(join(OUT_AGG, "distribucion-sede.json"), JSON.stringify(distribucionSede));
writeFileSync(join(OUT_AGG, "ranking-preguntas.json"), JSON.stringify(rankingPreguntas));
writeFileSync(join(OUT_AGG, "respuestas-otro.json"), JSON.stringify(respuestasOtro));
writeFileSync(join(OUT_AGG, "serie-tiempo.json"), JSON.stringify(serieTiempo));
writeFileSync(join(OUT_AGG, "combinaciones-rol.json"), JSON.stringify(combinacionesRol));
writeFileSync(join(OUT_AGG, "kpis.json"), JSON.stringify(kpis));

console.log("ETL completado:");
console.log(`  personas: ${personas.length}`);
console.log(`  rolesAsignados: ${rolesAsignados.length}`);
console.log(`  respuestas: ${respuestas.length} (otro: ${respuestasOtro.length})`);
console.log(`  KPIs:`, kpis);
