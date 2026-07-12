import "server-only";
import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import * as XLSX from "xlsx";
import type { ConferenciaCard, TipoCardConferencista } from "@/types/conferencistas";
import type { ConferencistasDataSource } from "./types";

/**
 * Lee en vivo la hoja "Base de Datos" de Participación jornadas.xlsx — única
 * fuente del módulo Conferencistas. La hoja ya está diseñada como tabla de
 * tarjetas (columnas *_card: nombre_card, titulo_card, fecha_card, etc.), así
 * que no hay agregación que hacer: se tipa cada fila, se descartan las que
 * tengan `publicar` en falso y se ordena por `orden_card`. Sin JSON
 * intermedio; cache en memoria invalidado por `fs.statSync().mtimeMs`, igual
 * que el resto de los datasources del proyecto.
 */
export class ExcelConferencistasDataSource implements ConferencistasDataSource {
  private readonly ruta: string;
  private cache: ConferenciaCard[] | null = null;
  private mtimeCache: number | null = null;

  constructor(directorioFuente = join(process.cwd(), "data", "source-conferencistas")) {
    this.ruta = join(directorioFuente, "Participacion jornadas.xlsx");
  }

  getConferencias(): ConferenciaCard[] {
    return this.datos();
  }

  private datos(): ConferenciaCard[] {
    const mtime = statSync(this.ruta).mtimeMs;
    if (!this.cache || this.mtimeCache !== mtime) {
      this.cache = this.parsear();
      this.mtimeCache = mtime;
    }
    return this.cache;
  }

  private parsear(): ConferenciaCard[] {
    const buffer = readFileSync(this.ruta);
    const wb = XLSX.read(buffer, { type: "buffer" });
    const hoja = wb.Sheets["Base de Datos"];
    if (!hoja) return [];

    const filas = XLSX.utils.sheet_to_json(hoja, { header: 1, raw: true, defval: null }) as unknown[][];
    const encabezado = filas.shift();
    if (!encabezado) return [];

    const col = (nombre: string) => encabezado.indexOf(nombre);
    const idx = {
      idRegistro: col("id_registro"),
      nombreCard: col("nombre_card"),
      tituloCard: col("titulo_card"),
      fechaCard: col("fecha_card"),
      ubicacionCard: col("ubicacion_card"),
      modalidad: col("modalidad"),
      descripcionCard: col("descripcion_card"),
      enlaceCard: col("enlace_card"),
      textoAlt: col("texto_alternativo_imagen"),
      ordenCard: col("orden_card"),
      tipoCard: col("tipo_card"),
      publicar: col("publicar"),
      asistentes: col("asistentes_presenciales"),
      vistas: col("vistas_redes_sociales"),
    };

    return filas
      .filter((f) => f[idx.idRegistro] != null && f[idx.publicar] === true)
      .map((f) => ({
        id: Number(f[idx.idRegistro]),
        nombre: String(f[idx.nombreCard] ?? "").trim(),
        titulo: String(f[idx.tituloCard] ?? "").trim(),
        fecha: String(f[idx.fechaCard] ?? "").trim(),
        ubicacion: String(f[idx.ubicacionCard] ?? "").trim(),
        modalidad: String(f[idx.modalidad] ?? "").trim(),
        descripcion: String(f[idx.descripcionCard] ?? "").trim(),
        enlace: f[idx.enlaceCard] ? String(f[idx.enlaceCard]).trim() : null,
        textoAlternativoImagen: String(f[idx.textoAlt] ?? f[idx.nombreCard] ?? "").trim(),
        orden: Number(f[idx.ordenCard] ?? 0),
        tipo: (f[idx.tipoCard] === "Grupo" ? "Grupo" : "Participante") as TipoCardConferencista,
        asistentesPresenciales: f[idx.asistentes] != null ? Number(f[idx.asistentes]) : null,
        vistasRedesSociales: f[idx.vistas] != null ? Number(f[idx.vistas]) : null,
      }))
      .sort((a, b) => a.orden - b.orden);
  }
}
