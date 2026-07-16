import "server-only";
import { join } from "node:path";
import type { FilaMeta } from "@/types/metas";
import type { MetasDataSource } from "./types";
import { leerPrimeraHoja } from "./infrastructure/excel";
import { CacheArchivo } from "./infrastructure/cache-archivo";

/**
 * Lee los 5 .xlsx de "Metas" (uno por rol/categoría) y los expone como filas
 * tipadas. Cada archivo ya es una tabla dinámica exportada (una fila por
 * categoría con columnas NO/SI/Total general/Porcentaje) — no se recalculan
 * agregados aquí, solo se tipa y normaliza el nombre de columnas, que varía
 * ligeramente de un archivo a otro.
 *
 * Igual que el resto de los orígenes: sin JSON intermedio y con caché por
 * archivo (ver CacheArchivo).
 */
export class ExcelMetasDataSource implements MetasDataSource {
  private readonly rutas: {
    gca: string;
    administrativosContrato: string;
    administrativosSede: string;
    estudiantes: string;
    graduados: string;
  };

  private readonly cache: CacheArchivo<{
    gca: FilaMeta[];
    administrativosContrato: FilaMeta[];
    administrativosSede: FilaMeta[];
    estudiantes: FilaMeta[];
    graduados: FilaMeta[];
  }>;

  constructor(directorioFuente = join(process.cwd(), "data", "source-metas")) {
    this.rutas = {
      gca: join(directorioFuente, "Analisis GCA.xlsx"),
      administrativosContrato: join(directorioFuente, "OPS-APA ADMIN.xlsx"),
      administrativosSede: join(directorioFuente, "Analisis ADM.xlsx"),
      estudiantes: join(directorioFuente, "Analisis Estudiantes.xlsx"),
      graduados: join(directorioFuente, "Analisis Graduados.xlsx"),
    };
    this.cache = new CacheArchivo(Object.values(this.rutas), () => ({
      gca: this.leerTabla(this.rutas.gca, 0, 1, 2, 3, 4),
      // OPS-APA ADMIN.xlsx tiene una columna extra "Rol" al inicio (constante
      // "OPS - APA"): la etiqueta de fila real es "Tipo Contrato (Modalidad)".
      administrativosContrato: this.leerTabla(this.rutas.administrativosContrato, 1, 2, 3, 4, 5),
      administrativosSede: this.leerTabla(this.rutas.administrativosSede, 0, 1, 2, 3, 4),
      estudiantes: this.leerTabla(this.rutas.estudiantes, 0, 1, 2, 3, 4),
      graduados: this.leerTabla(this.rutas.graduados, 0, 1, 2, 3, 4),
    }));
  }

  getGestoresConocimiento(): FilaMeta[] {
    return this.cache.obtener().gca;
  }

  getAdministrativosPorContrato(): FilaMeta[] {
    return this.cache.obtener().administrativosContrato;
  }

  getAdministrativosPorSede(): FilaMeta[] {
    return this.cache.obtener().administrativosSede;
  }

  getCreadorOportunidad(): FilaMeta[] {
    return this.cache.obtener().estudiantes;
  }

  getGraduados(): FilaMeta[] {
    return this.cache.obtener().graduados;
  }

  private leerTabla(
    ruta: string,
    idxEtiqueta: number,
    idxNo: number,
    idxSi: number,
    idxTotal: number,
    idxPorcentaje: number
  ): FilaMeta[] {
    const filas = leerPrimeraHoja(ruta);
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
      // De mayor a menor Total general: agrupa primero las categorías con más
      // muestra y deja al final los casos de N muy pequeño (p.ej. "Fondo
      // Instituto de Posgrados" con Total=1), cuyo porcentaje es poco
      // representativo por sí solo.
      .sort((a, b) => b.total - a.total);
  }
}
