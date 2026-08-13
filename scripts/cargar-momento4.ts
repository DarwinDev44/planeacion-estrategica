/**
 * Carga inicial: sube a Neon los .xlsx que estén en
 * `data/source-momento4-planeacion-territorial`, uno por transformación.
 *
 * Se ejecuta a mano —`pnpm cargar:momento4`— y es el equivalente por consola de
 * lo que hace la vista /admin: usa el mismo repositorio, así que valida el
 * formato con las mismas reglas y escribe con la misma transacción. Cargar por
 * otro camino podría meter en la base filas que la aplicación no habría
 * aceptado.
 *
 * Es repetible: cada cargue reemplaza las respuestas de su transformación.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { TRANSFORMACIONES_MOMENTO4, transformacionDeArchivo } from "@/lib/reglas/momento4";
import { conexionSql } from "@/repositories/datasource/infrastructure/neon";
import { guardarDocumento } from "@/repositories/datasource/momento4-almacen";
import { cargarEntorno } from "./entorno";

const DIRECTORIO = join(process.cwd(), "data", "source-momento4-planeacion-territorial");

async function main() {
  cargarEntorno();
  // Conexión directa (sin pooler): es una carga administrativa, no tráfico del
  // sitio.
  const sql = conexionSql({ directa: true });

  const archivos = readdirSync(DIRECTORIO).filter((nombre) => nombre.toLowerCase().endsWith(".xlsx"));
  console.log(`${archivos.length} archivo(s) en ${DIRECTORIO}\n`);

  const cargadas = new Set<string>();

  for (const archivo of archivos) {
    // Para la carga inicial sí se deduce la transformación del nombre: los
    // archivos de origen la traen entre paréntesis. En la vista /admin no se
    // hace —ahí la elige quien sube— porque el nombre del export varía.
    const transformacion = transformacionDeArchivo(archivo);
    if (!transformacion) {
      console.log(`  ✗ ${archivo}\n      el nombre no dice a qué transformación corresponde`);
      continue;
    }

    const resultado = await guardarDocumento(
      sql,
      transformacion.id,
      archivo,
      readFileSync(join(DIRECTORIO, archivo))
    );
    console.log(`  ${resultado.aceptado ? "✓" : "✗"} ${archivo}\n      ${resultado.motivo}`);
    if (resultado.aceptado) cargadas.add(transformacion.id);
  }

  const faltantes = TRANSFORMACIONES_MOMENTO4.filter((t) => !cargadas.has(t.id));
  console.log(`\nCargadas ${cargadas.size} de ${TRANSFORMACIONES_MOMENTO4.length} transformaciones.`);
  if (faltantes.length > 0) {
    console.log(`Sin cargar: ${faltantes.map((t) => t.etiqueta).join(", ")}`);
  }
}

main().catch((error) => {
  console.error("Falló la carga:", error);
  process.exit(1);
});
