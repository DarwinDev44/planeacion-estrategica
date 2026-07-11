import "server-only";
import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import * as XLSX from "xlsx";
import type { FilaMeta } from "@/types/metas";
import type { MetasDataSource } from "./types";

/**
 * Lee los 5 .xlsx de "Metas" (uno por rol/categoría) y los expone como filas
 * tipadas. Cada archivo ya es una tabla dinámica exportada (una fila por
 * categoría con columnas NO/SI/Total general/Porcentaje) — no se recalculan
 * agregados aquí, solo se tipa y normaliza el nombre de columnas, que varía
 * ligeramente de un archivo a otro.
 *
 * Igual que `ExcelEncuestaDataSource`: sin JSON intermedio, cache en memoria
 * invalidado por `fs.statSync().mtimeMs` de cada archivo.
 */
export class ExcelMetasDataSource implements MetasDataSource {
  private readonly rutas: {
    gca: string;
    administrativosContrato: string;
    administrativosSede: string;
    estudiantes: string;
    graduados: string;
  };

  private cache: {
    gca: FilaMeta[];
    administrativosContrato: FilaMeta[];
    administrativosSede: FilaMeta[];
    estudiantes: FilaMeta[];
    graduados: FilaMeta[];
  } | null = null;
  private mtimesCache: Record<string, number> | null = null;

  constructor(directorioFuente = join(process.cwd(), "data", "source-metas")) {
    this.rutas = {
      gca: join(directorioFuente, "Analisis GCA.xlsx"),
      administrativosContrato: join(directorioFuente, "OPS-APA ADMIN.xlsx"),
      administrativosSede: join(directorioFuente, "Analisis ADM.xlsx"),
      estudiantes: join(directorioFuente, "Analisis Estudiantes.xlsx"),
      graduados: join(directorioFuente, "Analisis Graduados.xlsx"),
    };
  }

  getGestoresConocimiento(): FilaMeta[] {
    return this.datos().gca;
  }

  getAdministrativosPorContrato(): FilaMeta[] {
    return this.datos().administrativosContrato;
  }

  getAdministrativosPorSede(): FilaMeta[] {
    return this.datos().administrativosSede;
  }

  getCreadorOportunidad(): FilaMeta[] {
    return this.datos().estudiantes;
  }

  getGraduados(): FilaMeta[] {
    return this.datos().graduados;
  }

  private datos() {
    const mtimes: Record<string, number> = {};
    for (const [clave, ruta] of Object.entries(this.rutas)) {
      mtimes[clave] = statSync(ruta).mtimeMs;
    }
    const cambio =
      !this.cache ||
      !this.mtimesCache ||
      Object.entries(mtimes).some(([clave, mtime]) => this.mtimesCache![clave] !== mtime);

    if (cambio) {
      this.cache = {
        gca: this.leerTabla(this.rutas.gca, 0, 1, 2, 3, 4),
        // OPS-APA ADMIN.xlsx tiene una columna extra "Rol" al inicio (constante
        // "OPS - APA"): la etiqueta de fila real es "Tipo Contrato (Modalidad)".
        administrativosContrato: this.leerTabla(this.rutas.administrativosContrato, 1, 2, 3, 4, 5),
        administrativosSede: this.leerTabla(this.rutas.administrativosSede, 0, 1, 2, 3, 4),
        estudiantes: this.leerTabla(this.rutas.estudiantes, 0, 1, 2, 3, 4),
        graduados: this.leerTabla(this.rutas.graduados, 0, 1, 2, 3, 4),
      };
      this.mtimesCache = mtimes;
    }
    return this.cache!;
  }

  private leerHoja(ruta: string): unknown[][] {
    const buffer = readFileSync(ruta);
    const wb = XLSX.read(buffer, { type: "buffer" });
    const hoja = wb.Sheets[wb.SheetNames[0]];
    return XLSX.utils.sheet_to_json(hoja, { header: 1, raw: true, defval: null }) as unknown[][];
  }

  private leerTabla(
    ruta: string,
    idxEtiqueta: number,
    idxNo: number,
    idxSi: number,
    idxTotal: number,
    idxPorcentaje: number
  ): FilaMeta[] {
    const filas = this.leerHoja(ruta);
    filas.shift(); // encabezado
    return filas
      .filter((f) => f[idxEtiqueta] != null)
      .map((f) => ({
        etiqueta: String(f[idxEtiqueta]).trim(),
        no: Number(f[idxNo] ?? 0),
        si: Number(f[idxSi] ?? 0),
        total: Number(f[idxTotal] ?? 0),
        porcentaje: Number(f[idxPorcentaje] ?? 0) * 100,
      }))
      .sort((a, b) => a.etiqueta.localeCompare(b.etiqueta, "es"));
  }
}
