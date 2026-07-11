import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import * as XLSX from "xlsx";

const CORREO_EXCLUIDO = "lmireyarincon@ucundinamarca.edu.co";
const entrada = join(process.cwd(), "..", "Accesos a CAI Planeación estratégica", "Accesos1.xlsx");
const salida = join(process.cwd(), "data", "accesos-cai.json");
const rutaPadron = join(process.cwd(), "data", "cai.json");

type Celda = string | number | Date | null;

interface RegistroCrudo {
  nombre: string;
  correo: string;
  dias: number;
  fecha: string;
}

interface CaiDataMinimo {
  actividades: Array<{
    participantes: Array<{ nombre: string; correo: string }>;
  }>;
}

const cai = JSON.parse(readFileSync(rutaPadron, "utf8")) as CaiDataMinimo;
const participantesOficiales = cai.actividades[0]?.participantes ?? [];
const nombreOficialPorCorreo = new Map(
  participantesOficiales.map((persona) => [persona.correo.trim().toLowerCase(), persona.nombre])
);

const libro = XLSX.read(readFileSync(entrada), { type: "buffer", cellDates: true });
const hoja = libro.Sheets[libro.SheetNames[0]];
const filas = XLSX.utils.sheet_to_json<Celda[]>(hoja, { header: 1, raw: true, defval: null });
const registros: RegistroCrudo[] = filas
  .slice(1)
  .map((fila) => ({
    nombre: limpiarTexto(fila[0]),
    correo: normalizarCorreo(limpiarTexto(fila[1]).toLowerCase(), limpiarTexto(fila[0])),
    dias: Number(fila[4]),
    fecha: fechaISO(fila[5]),
  }))
  .filter(
    (registro) =>
      registro.nombre &&
      registro.correo &&
      registro.correo !== CORREO_EXCLUIDO &&
      nombreOficialPorCorreo.has(registro.correo) &&
      Number.isFinite(registro.dias) &&
      registro.fecha
  );

const nombrePorCorreo = new Map(nombreOficialPorCorreo);
for (const registro of registros) {
  const actual = nombrePorCorreo.get(registro.correo) ?? "";
  const candidato = limpiarNombre(registro.nombre);
  if (candidato.length > actual.length) nombrePorCorreo.set(registro.correo, candidato);
}

const porFecha = new Map<string, RegistroCrudo[]>();
for (const registro of registros) {
  const filasFecha = porFecha.get(registro.fecha) ?? [];
  filasFecha.push(registro);
  porFecha.set(registro.fecha, filasFecha);
}
const cortes = [...porFecha.entries()]
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([fecha, filasFecha]) => {
    const porCorreo = new Map<string, RegistroCrudo>();
    for (const registro of filasFecha) {
      const actual = porCorreo.get(registro.correo);
      if (!actual || registro.dias > actual.dias) porCorreo.set(registro.correo, registro);
    }

    const personas = [...porCorreo.values()]
      .map((registro) => ({
        nombre: nombrePorCorreo.get(registro.correo) ?? registro.nombre,
        correo: registro.correo,
        dias: registro.dias,
      }))
      .sort((a, b) => b.dias - a.dias || a.nombre.localeCompare(b.nombre, "es"));

    return {
      fecha,
      personasUnicas: porCorreo.size,
      registros: filasFecha.length,
      promedioDias: redondear(promedio(filasFecha.map((registro) => registro.dias))),
      personas,
      rangos: [
        { etiqueta: "0–1 día", cantidad: personas.filter((p) => p.dias <= 1).length },
        { etiqueta: "2–3 días", cantidad: personas.filter((p) => p.dias >= 2 && p.dias <= 3).length },
        { etiqueta: "4–7 días", cantidad: personas.filter((p) => p.dias >= 4 && p.dias <= 7).length },
        { etiqueta: "8+ días", cantidad: personas.filter((p) => p.dias >= 8).length },
      ],
    };
  });

const promedios = cortes.map((corte) => corte.promedioDias);
const salidaJson = {
  fuente: "Accesos1.xlsx",
  correoExcluido: CORREO_EXCLUIDO,
  correoExcluidoEncontrado: filas.some(
    (fila) => limpiarTexto(fila[1]).toLowerCase() === CORREO_EXCLUIDO
  ),
  promedioGlobal: redondear(promedio(promedios)),
  cortes: cortes.map((corte, indice) => {
    const anterior = cortes[indice - 1]?.promedioDias;
    return {
      ...corte,
      variacionDias: anterior == null ? null : redondear(corte.promedioDias - anterior),
      variacionPorcentaje:
        anterior == null ? null : redondear(((corte.promedioDias - anterior) / anterior) * 100),
    };
  }),
};

writeFileSync(salida, `${JSON.stringify(salidaJson, null, 2)}\n`, "utf8");
console.log(
  `Generado ${salida}: ${cortes.at(-1)?.personasUnicas ?? 0} personas únicas en el corte más reciente.`
);

function limpiarTexto(valor: Celda | undefined): string {
  return String(valor ?? "").replace(/\u00a0/g, " ").trim();
}

function limpiarNombre(nombre: string): string {
  const limpio = nombre.trim();
  const tienePrefijoDeIniciales =
    limpio.length > 3 && limpio[0] === limpio[2] && !limpio.slice(0, 3).includes(" ");
  return tienePrefijoDeIniciales ? limpio.slice(2).trim() : limpio;
}

function normalizarCorreo(correo: string, nombre: string): string {
  if (correo === "eduardoroa@ucundinamarca.edu.co") {
    return "eeduardoroa@ucundinamarca.edu.co";
  }
  if (correo === "egutierrez@ucundinamarca.edu.co" && nombre.toUpperCase().includes("RODRIGUEZ")) {
    return "egutierrezrodriguez@ucundinamarca.edu.co";
  }
  return correo;
}

function fechaISO(valor: Celda | undefined): string {
  if (valor instanceof Date && !Number.isNaN(valor.getTime())) return valor.toISOString().slice(0, 10);
  if (typeof valor === "number") {
    const fecha = XLSX.SSF.parse_date_code(valor);
    return fecha ? `${fecha.y}-${String(fecha.m).padStart(2, "0")}-${String(fecha.d).padStart(2, "0")}` : "";
  }
  const fecha = new Date(String(valor ?? ""));
  return Number.isNaN(fecha.getTime()) ? "" : fecha.toISOString().slice(0, 10);
}

function promedio(valores: number[]): number {
  return valores.length ? valores.reduce((total, valor) => total + valor, 0) / valores.length : 0;
}

function redondear(valor: number): number {
  return Math.round(valor * 100) / 100;
}
