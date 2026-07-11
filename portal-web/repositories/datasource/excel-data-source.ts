import "server-only";
import { statSync } from "node:fs";
import { join } from "node:path";
import type { Persona, RolAsignado, RespuestaPregunta, PreguntaId, Sede, Rol } from "@/types/encuesta";
import { PREGUNTAS } from "@/constants/preguntas";
import { AREA_A_FACULTAD } from "@/constants/marca";
import type { EncuestaDataSource } from "./types";
import { leerPrimeraHoja, excelSerialToISO } from "./excel-utils";

/**
 * Lee los dos archivos .xlsx que son la fuente de datos autorizada de la
 * encuesta y los transforma en las entidades tipadas que usa el resto de la
 * aplicación. No hay ningún JSON intermedio generado a mano: cualquier
 * cambio guardado en los .xlsx se refleja automáticamente en la siguiente
 * consulta, sin reconstruir ni ejecutar ningún script.
 *
 * Rendimiento: el resultado se cachea en memoria por proceso y solo se
 * vuelve a parsear cuando cambia la fecha de modificación de alguno de los
 * dos archivos (`fs.statSync().mtimeMs`) — evita re-parsear ~10.000 filas en
 * cada request sin sacrificar que los datos sean siempre los del Excel.
 */
export class ExcelEncuestaDataSource implements EncuestaDataSource {
  private readonly rutaParticipacion: string;
  private readonly rutaIdxRoles: string;

  private cache: {
    personas: Persona[];
    rolesAsignados: RolAsignado[];
    respuestas: RespuestaPregunta[];
  } | null = null;
  private mtimesCache: { participacion: number; idxRoles: number } | null = null;

  constructor(directorioFuente = join(process.cwd(), "data", "source")) {
    this.rutaParticipacion = join(directorioFuente, "participacion.xlsx");
    this.rutaIdxRoles = join(directorioFuente, "idxroles.xlsx");
  }

  getPersonas(): Persona[] {
    return this.datos().personas;
  }

  getRolesAsignados(): RolAsignado[] {
    return this.datos().rolesAsignados;
  }

  getRespuestas(): RespuestaPregunta[] {
    return this.datos().respuestas;
  }

  private datos() {
    const mtimes = {
      participacion: statSync(this.rutaParticipacion).mtimeMs,
      idxRoles: statSync(this.rutaIdxRoles).mtimeMs,
    };
    const cambio =
      !this.cache ||
      !this.mtimesCache ||
      mtimes.participacion !== this.mtimesCache.participacion ||
      mtimes.idxRoles !== this.mtimesCache.idxRoles;

    if (cambio) {
      this.cache = this.parsear();
      this.mtimesCache = mtimes;
    }
    return this.cache!;
  }

  /**
   * Decisión de alcance documentada (ver docs/02-investigacion-arquitectura.md):
   * el archivo principal repite Sede/Facultad/Programa hasta en 4 bloques
   * posicionales (uno por rol adicional), sin una columna que declare a qué
   * rol pertenece cada bloque. La geografía se toma de las columnas resumen
   * "Unidad Regional" / "Programa o Area" (ligadas al Rol principal, 0%
   * nulas); el conteo de roles reales viene de idxroles.xlsx, ya normalizado.
   * Facultad se deriva de un diccionario Programa→Facultad construido a
   * partir de los propios bloques (que sí traen ambos valores juntos).
   */
  private parsear() {
    const filasIdx = leerPrimeraHoja(this.rutaIdxRoles);
    filasIdx.shift();
    const rolesAsignados: RolAsignado[] = filasIdx
      .filter((r) => r[0] != null)
      .map((r) => ({
        personaId: Number(r[0]),
        rol: String(r[1]) as Rol,
        cantidadRoles: Number(r[2]),
      }));

    const filas = leerPrimeraHoja(this.rutaParticipacion);
    filas.shift();

    const BLOQUES = [
      { facultad: 13, programas: [14, 15, 16, 17, 18, 19, 20, 21] },
      { facultad: 23, programas: [24, 25, 26, 27, 28, 29, 30, 31] },
      { facultad: 33, programas: [34, 35, 36, 37, 38, 39, 40, 41] },
    ];
    const programaAFacultad = new Map<string, string>();
    for (const row of filas) {
      for (const bloque of BLOQUES) {
        const facultad = row[bloque.facultad] as string | null;
        if (!facultad) continue;
        for (const pIdx of bloque.programas) {
          const programa = row[pIdx] as string | null;
          if (programa) programaAFacultad.set(normalizar(programa), facultad);
        }
      }
    }

    const PREGUNTA_COL: Record<PreguntaId, number> = { P1: 44, P2: 45, P3: 46, P4: 47 };
    const OPCIONES_POR_PREGUNTA: Record<PreguntaId, Set<string>> = PREGUNTAS.reduce(
      (acc, p) => ({ ...acc, [p.id]: new Set(p.opciones) }),
      {} as Record<PreguntaId, Set<string>>
    );

    const personas: Persona[] = [];
    const respuestas: RespuestaPregunta[] = [];

    for (const row of filas) {
      const id = row[0];
      if (id == null) continue;

      const sedeRaw = row[8] as string | null;
      const programaOArea = row[10] as string | null;
      const facultad = programaOArea
        ? (programaAFacultad.get(normalizar(programaOArea)) ?? AREA_A_FACULTAD[normalizar(programaOArea)] ?? null)
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
        for (const opcion of raw.split(";").map((s) => s.trim()).filter(Boolean)) {
          respuestas.push({
            personaId: Number(id),
            preguntaId,
            opcion,
            esOtro: !OPCIONES_POR_PREGUNTA[preguntaId].has(opcion),
          });
        }
      }
    }

    return { personas, rolesAsignados, respuestas };
  }
}

function normalizar(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toUpperCase();
}
