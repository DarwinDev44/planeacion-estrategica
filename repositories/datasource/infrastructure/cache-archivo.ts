import "server-only";
import { statSync } from "node:fs";

/**
 * Caché en memoria de un valor derivado de archivos, invalidada cuando esos
 * archivos cambian: se compara la fecha de modificación de cada uno
 * (`fs.statSync().mtimeMs`) y la propia lista de rutas, de modo que agregar o
 * quitar un archivo también invalida (necesario para los orígenes que leen un
 * directorio completo, no una lista fija).
 *
 * Es la pieza que hace viable la regla del proyecto "el Excel es la única
 * fuente de verdad": los datos siempre salen del archivo, pero no se reparsean
 * en cada request — solo cuando el archivo realmente cambió. Editar el .xlsx se
 * refleja en la siguiente petición, sin reiniciar ni ejecutar ningún script.
 *
 * Antes esta lógica estaba copiada en cada datasource; centralizarla evita que
 * un módulo nuevo se olvide de cachear (como ocurría con analítica de momentos,
 * que releía los 8 Excel en cada request).
 */
export class CacheArchivo<T> {
  private valor: T | null = null;
  private version: string | null = null;

  /**
   * @param rutas Archivos que determinan la vigencia del valor. Se admite una
   *   función para los orígenes cuyo conjunto de archivos se descubre en disco
   *   y puede cambiar entre llamadas (p. ej. leer un directorio completo).
   * @param calcular Se ejecuta solo cuando no hay valor vigente.
   */
  constructor(
    private readonly rutas: readonly string[] | (() => readonly string[]),
    private readonly calcular: () => T
  ) {}

  obtener(): T {
    const rutas = typeof this.rutas === "function" ? this.rutas() : this.rutas;
    const versionActual = rutas.map((ruta) => `${ruta}:${statSync(ruta).mtimeMs}`).join("|");

    if (this.valor === null || this.version !== versionActual) {
      this.valor = this.calcular();
      this.version = versionActual;
    }
    return this.valor;
  }
}
