/**
 * Verificación de consistencia del módulo Metas: compara cifras puntuales
 * leídas de data/source-metas/*.xlsx contra los valores de la imagen de
 * referencia que definió el alcance del módulo. Se ejecuta a mano
 * (`pnpm validar:metas`) después de cualquier actualización de esos Excel,
 * para confirmar que la fuente sigue siendo consistente con lo esperado
 * antes de dar por buena la información que se muestra en /metas.
 *
 * Lee a través del mismo módulo que usa el sitio
 * (`repositories/datasource/infrastructure/excel`) y no con una copia propia:
 * si las opciones de lectura cambiaran, el script debe ver exactamente lo que
 * ve la aplicación — validar con otro lector no probaría nada.
 */
import { join } from "node:path";
import { leerPrimeraHoja } from "@/repositories/datasource/infrastructure/excel";

const DIR = join(process.cwd(), "data", "source-metas");

function leer(archivo: string): unknown[][] {
  const filas = leerPrimeraHoja(join(DIR, archivo));
  filas.shift();
  return filas;
}

function buscar(filas: unknown[][], etiqueta: string, idxEtiqueta = 0): unknown[] | undefined {
  return filas.find((f) => String(f[idxEtiqueta]).trim() === etiqueta);
}

interface Esperado {
  nombre: string;
  fila: unknown[] | undefined;
  idxNo: number;
  idxSi: number;
  idxTotal: number;
  idxPorcentaje: number;
  no: number;
  si: number;
  total: number;
  porcentaje: number;
}

const casos: Esperado[] = [];
function agregar(
  nombre: string,
  fila: unknown[] | undefined,
  [idxNo, idxSi, idxTotal, idxPorcentaje]: [number, number, number, number],
  [no, si, total, porcentaje]: [number, number, number, number]
) {
  casos.push({ nombre, fila, idxNo, idxSi, idxTotal, idxPorcentaje, no, si, total, porcentaje });
}

const gca = leer("Analisis GCA.xlsx");
agregar("GCA/Deporte", buscar(gca, "Facultad de Ciencias del Deporte y Educación Física"), [1, 2, 3, 4], [15, 41, 56, 73.21]);
agregar("GCA/Sociales", buscar(gca, "Facultad de Ciencias Sociales - Humanidades y Ciencias Políticas"), [1, 2, 3, 4], [7, 48, 55, 87.27]);
agregar("GCA/Educación", buscar(gca, "Facultad de Educación"), [1, 2, 3, 4], [3, 21, 24, 87.5]);
agregar("GCA/Agropecuarias", buscar(gca, "Facultad de Ciencias Agropecuarias"), [1, 2, 3, 4], [12, 140, 152, 92.11]);
agregar("GCA/Salud", buscar(gca, "Facultad de Ciencias de la Salud"), [1, 2, 3, 4], [6, 97, 103, 94.17]);
agregar("GCA/Administrativa", buscar(gca, "Facultad de Ciencias Administrativas, Económicas y Contables"), [1, 2, 3, 4], [8, 205, 213, 96.24]);

const ops = leer("OPS-APA ADMIN.xlsx"); // [Rol, TipoContrato, NO, SI, Total, Porcentaje]
agregar("OPS/Orden Prestación", buscar(ops, "Orden de Prestación de Servicios", 1), [2, 3, 4, 5], [2, 84, 86, 97.67]);
agregar("OPS/Personal Académico", buscar(ops, "Personal Académico", 1), [2, 3, 4, 5], [27, 108, 135, 80]);

const adm = leer("Analisis ADM.xlsx");
agregar("ADM/Zipaquirá", buscar(adm, "Extensión Zipaquirá"), [1, 2, 3, 4], [0, 26, 26, 100]);
agregar("ADM/Ubaté", buscar(adm, "Seccional Ubaté"), [1, 2, 3, 4], [4, 41, 45, 91.11]);
agregar("ADM/Chía", buscar(adm, "Extensión Chía"), [1, 2, 3, 4], [19, 28, 47, 59.57]);
agregar("ADM/Soacha", buscar(adm, "Extensión Soacha"), [1, 2, 3, 4], [3, 46, 49, 93.88]);

const est = leer("Analisis Estudiantes.xlsx");
agregar("EST/Adm Empresas", buscar(est, "Administración De Empresas"), [1, 2, 3, 4], [837, 1821, 2658, 68.51]);
agregar("EST/Contaduría", buscar(est, "Contaduría Pública"), [1, 2, 3, 4], [707, 1223, 1930, 63.37]);
agregar("EST/Doctorado Educ", buscar(est, "Doctorado En Ciencias De La Educación"), [1, 2, 3, 4], [17, 2, 19, 10.53]);
agregar("EST/Enfermería", buscar(est, "Enfermería"), [1, 2, 3, 4], [199, 201, 400, 50.25]);

const grad = leer("Analisis Graduados.xlsx");
agregar("GRAD/Adm Agropecuaria", buscar(grad, "Administración Agropecuaria"), [1, 2, 3, 4], [121, 2, 123, 1.63]);
agregar("GRAD/Adm Agropecuaria.", buscar(grad, "Administración Agropecuaria."), [1, 2, 3, 4], [178, 2, 180, 1.11]);
// Caso deliberadamente sin corregir (ver __corregir-metas.cjs / commit): fusionar
// la tilde crearía el mismo texto que "Administración De Empresas" y se
// perdería la forma de distinguir estas dos filas con datos distintos.
agregar("GRAD/Adm Empresas (sin tilde, a propósito)", buscar(grad, "Administracion De Empresas"), [1, 2, 3, 4], [6631, 212, 6843, 3.1]);
agregar("GRAD/Administración Empresas (con tilde)", buscar(grad, "Administración De Empresas"), [1, 2, 3, 4], [2751, 49, 2800, 1.75]);

let ok = 0;
let fallos = 0;
for (const c of casos) {
  if (!c.fila) {
    console.error(`FALLO ${c.nombre}: fila no encontrada`);
    fallos++;
    continue;
  }
  const no = Number(c.fila[c.idxNo]);
  const si = Number(c.fila[c.idxSi]);
  const total = Number(c.fila[c.idxTotal]);
  const porcentaje = Math.round(Number(c.fila[c.idxPorcentaje]) * 10000) / 100;
  const coincide =
    no === c.no && si === c.si && total === c.total && Math.abs(porcentaje - c.porcentaje) < 0.02;
  if (coincide) {
    ok++;
  } else {
    fallos++;
    console.error(
      `FALLO ${c.nombre}: obtenido NO=${no} SI=${si} Total=${total} %=${porcentaje} | esperado NO=${c.no} SI=${c.si} Total=${c.total} %=${c.porcentaje}`
    );
  }
}

console.log(`\nMetas: ${ok} OK / ${fallos} fallos de ${casos.length} verificaciones`);
if (fallos > 0) process.exit(1);
