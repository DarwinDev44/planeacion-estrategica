/**
 * Carga el `.env` para los scripts de mantenimiento. Next lo hace solo cuando
 * arranca el sitio, pero `tsx scripts/*.ts` corre en un Node pelado que no lo
 * lee: sin esto, DATABASE_URL llegaría vacía.
 *
 * Se usa `process.loadEnvFile` (Node 20.12+) en vez de agregar `dotenv` como
 * dependencia: hace exactamente lo mismo y ya viene con el runtime.
 */
export function cargarEntorno(archivo = ".env"): void {
  try {
    process.loadEnvFile(archivo);
  } catch {
    // Sin archivo local no es un error: en CI o en el despliegue las variables
    // vienen del entorno. Quien las necesite fallará con un mensaje claro.
  }
}
