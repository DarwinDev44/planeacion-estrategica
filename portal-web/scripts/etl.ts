/**
 * ETL — Seguimiento participación actividades (CAI).
 *
 * Lee "../../Seguimiento  participación actividades/cai09072026.xlsx"
 * y genera data/cai.json conforme al contrato de types/cai.ts.
 *
 * Ejecutar: pnpm exec tsx scripts/etl.ts  (o pnpm etl)
 */

import * as XLSX from "xlsx";
import * as fs from "node:fs";
import * as path from "node:path";
import type {
  Actividad,
  CaiData,
  EstadoActividad,
  ParticipanteEstado,
} from "../types/cai";

const FUENTE = "cai09072026.xlsx";

const EXCEL_PATH = path.resolve(
  __dirname,
  "../../Seguimiento  participación actividades/cai09072026.xlsx",
);

const OUTPUT_PATH = path.resolve(__dirname, "../data/cai.json");

/** Redondea a 1 decimal. */
function pct(finalizados: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((finalizados / total) * 1000) / 10;
}

/** "2.2" → "2-2" */
function slugNumero(num: string): string {
  return num.replace(/\.+/g, "-").replace(/-+$/, "");
}

interface ColumnaActividad {
  indice: number;
  id: string;
  momento: number | null;
  etiquetaMomento: string;
  nombre: string;
  tituloCompleto: string;
}

/**
 * Nombres oficiales para actividades cuyo encabezado en el Excel no trae el
 * nombre completo (solo "Momento N actividad X"). Se aplican por id después
 * del parseo, así sobreviven a futuras regeneraciones del ETL.
 */
const NOMBRES_MANUALES: Record<string, string> = {
  "m3-a4-1": "Lectura Crítica para una Internacionalización con Identidad Territorial",
  "m3-a4-2": "El futuro de la educación superior y las tendencias mundiales",
};

function parseEncabezado(titulo: string, indice: number): ColumnaActividad {
  const limpio = titulo.trim();

  // Caso especial: Aceptación PAD
  if (/^aceptaci[oó]n\s+pad/i.test(limpio)) {
    return {
      indice,
      id: "aceptacion-pad",
      momento: null,
      etiquetaMomento: "Aceptación PAD",
      nombre: limpio, // "Aceptación PAD (Este es tu CAI)"
      tituloCompleto: limpio,
    };
  }

  // "Momento N actividad X[.Y] [(texto extra)] [: Nombre]"
  // Tolerante a texto adicional (p. ej. "(híbrido)") entre el número y los dos puntos.
  const m = limpio.match(
    /^Momento\s+(\d+)\s+actividad\s+([\d.]+)(?:[^:]*)?(?::\s*(.+))?$/i,
  );
  if (!m) {
    throw new Error(
      `Encabezado de actividad no reconocido (col ${indice}): "${limpio}"`,
    );
  }

  const momento = Number(m[1]);
  const numActividad = m[2].replace(/\.+$/, ""); // por si termina en "."
  const nombre = m[3]?.trim() || `Actividad ${numActividad}`;

  return {
    indice,
    id: `m${momento}-a${slugNumero(numActividad)}`,
    momento,
    etiquetaMomento: `Momento ${momento}`,
    nombre,
    tituloCompleto: limpio,
  };
}

function main(): void {
  if (!fs.existsSync(EXCEL_PATH)) {
    throw new Error(`No se encontró el Excel fuente: ${EXCEL_PATH}`);
  }

  const workbook = XLSX.readFile(EXCEL_PATH);
  const hoja = workbook.Sheets["Hoja1"] ?? workbook.Sheets[workbook.SheetNames[0]];
  if (!hoja) throw new Error("El libro no contiene hojas.");

  // Matriz cruda: fila 0 = encabezados.
  const filas: unknown[][] = XLSX.utils.sheet_to_json(hoja, {
    header: 1,
    defval: "",
    raw: false,
  });

  const encabezados = (filas[0] ?? []).map((c) => String(c ?? "").trim());
  if (encabezados.length < 4) {
    throw new Error("La hoja no tiene las columnas esperadas.");
  }

  // Columnas de actividad: desde la col 3 hasta la última con encabezado.
  const columnas: ColumnaActividad[] = [];
  for (let i = 3; i < encabezados.length; i++) {
    if (!encabezados[i]) continue;
    columnas.push(parseEncabezado(encabezados[i], i));
  }

  // "Aceptación PAD" es el paso previo a las actividades y siempre va
  // primero, sin importar en qué columna quedó en el Excel de origen.
  const idxPad = columnas.findIndex((c) => c.id === "aceptacion-pad");
  if (idxPad > 0) {
    const [pad] = columnas.splice(idxPad, 1);
    columnas.unshift(pad);
  }

  for (const col of columnas) {
    const nombreManual = NOMBRES_MANUALES[col.id];
    if (nombreManual) col.nombre = nombreManual;
  }

  // Filas de participantes (ignora filas sin nombre).
  interface Participante {
    nombre: string;
    correo: string;
    estados: EstadoActividad[]; // paralelo a `columnas`
  }

  const participantes: Participante[] = [];
  for (let f = 1; f < filas.length; f++) {
    const fila = filas[f] ?? [];
    const nombre = String(fila[0] ?? "").trim();
    if (!nombre) continue;
    const correo = String(fila[1] ?? "").trim();

    const estados = columnas.map((col) => {
      const valor = String(fila[col.indice] ?? "").trim();
      if (valor !== "Finalizado" && valor !== "No finalizado") {
        throw new Error(
          `Valor inesperado en fila ${f + 1}, columna "${col.tituloCompleto}": "${valor}"`,
        );
      }
      return valor as EstadoActividad;
    });

    participantes.push({ nombre, correo, estados });
  }

  const collator = new Intl.Collator("es", { sensitivity: "base" });

  const actividades: Actividad[] = columnas.map((col, idx) => {
    const lista: ParticipanteEstado[] = participantes.map((p) => ({
      nombre: p.nombre,
      correo: p.correo,
      estado: p.estados[idx],
    }));

    // Primero "No finalizado" (alfabético), luego "Finalizado" (alfabético).
    lista.sort((a, b) => {
      if (a.estado !== b.estado) return a.estado === "No finalizado" ? -1 : 1;
      return collator.compare(a.nombre, b.nombre);
    });

    const finalizados = lista.filter((p) => p.estado === "Finalizado").length;
    const noFinalizados = lista.length - finalizados;

    return {
      id: col.id,
      momento: col.momento,
      etiquetaMomento: col.etiquetaMomento,
      nombre: col.nombre,
      tituloCompleto: col.tituloCompleto,
      finalizados,
      noFinalizados,
      porcentajeFinalizacion: pct(finalizados, lista.length),
      participantes: lista,
    };
  });

  const totalRegistros = participantes.length * columnas.length;
  const totalFinalizados = actividades.reduce((s, a) => s + a.finalizados, 0);
  const totalNoFinalizados = totalRegistros - totalFinalizados;
  const momentosDistintos = new Set(
    columnas.map((c) => c.momento).filter((m): m is number => m !== null),
  );
  const participantesCompletos = participantes.filter((p) =>
    p.estados.every((e) => e === "Finalizado"),
  ).length;

  const data: CaiData = {
    generadoEl: new Date().toISOString(),
    fuente: FUENTE,
    totalParticipantes: participantes.length,
    totalActividades: actividades.length,
    totalMomentos: momentosDistintos.size,
    avanceGeneral: pct(totalFinalizados, totalRegistros),
    totalRegistros,
    totalFinalizados,
    totalNoFinalizados,
    participantesCompletos,
    actividades,
  };

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(data, null, 2) + "\n", "utf8");

  // Resumen en consola.
  console.log(`ETL OK → ${OUTPUT_PATH}`);
  console.log(`  Participantes:            ${data.totalParticipantes}`);
  console.log(`  Actividades:              ${data.totalActividades}`);
  console.log(`  Momentos:                 ${data.totalMomentos}`);
  console.log(`  Avance general:           ${data.avanceGeneral}%`);
  console.log(`  Registros (pers×act):     ${data.totalRegistros}`);
  console.log(`  Finalizados:              ${data.totalFinalizados}`);
  console.log(`  No finalizados:           ${data.totalNoFinalizados}`);
  console.log(`  Participantes completos:  ${data.participantesCompletos}`);
  const peores = [...actividades]
    .sort((a, b) => a.porcentajeFinalizacion - b.porcentajeFinalizacion)
    .slice(0, 3);
  console.log("  Menor % de finalización:");
  for (const a of peores) {
    console.log(
      `    - [${a.id}] ${a.etiquetaMomento} — ${a.nombre}: ${a.porcentajeFinalizacion}%`,
    );
  }
}

main();
