"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { COOKIE_ADMIN, DURACION_ACCESO_MINUTOS } from "@/constants/admin";
import type { ResultadoCargue } from "@/types/momento4";
import { guardarDocumentoMomento4 } from "@/repositories/momento4Repository";
import { tieneAccesoAdmin } from "./sesion";

/**
 * Comprueba el PIN contra ADMIN_PIN y, si coincide, abre el acceso escribiendo
 * la cookie de sesión. Vive en el servidor a propósito: el PIN nunca se envía
 * al navegador, así que no puede leerse inspeccionando la página.
 */
export async function validarPin(pin: string): Promise<boolean> {
  const esperado = process.env.ADMIN_PIN;

  // Sin ADMIN_PIN configurado no entra nadie. Falla cerrado a propósito: un
  // despliegue al que se le olvidó la variable debe dejar la puerta trabada,
  // no abierta.
  if (!esperado || pin.trim() !== esperado) return false;

  const galletas = await cookies();
  galletas.set(COOKIE_ADMIN, "true", {
    httpOnly: true,
    sameSite: "lax",
    path: "/admin",
    maxAge: DURACION_ACCESO_MINUTOS * 60,
    // Sin `secure`: el .exe portable se sirve por http en localhost, y una
    // cookie marcada como segura no se guardaría ahí. La cookie no contiene
    // el PIN ni ningún dato — solo la marca de que ya se validó.
  });
  return true;
}

/**
 * Carga el documento de UNA transformación del Momento 4. Se sube de a uno y
 * con la casilla de destino explícita porque el nombre del archivo varía entre
 * exports: lo único que se valida del archivo es que cumpla el formato.
 */
export async function subirDocumentoMomento4(datos: FormData): Promise<ResultadoCargue> {
  const transformacion = String(datos.get("transformacion") ?? "");
  const archivo = datos.get("documento");
  const nombre = archivo instanceof File ? archivo.name : "—";

  const fallo = (motivo: string): ResultadoCargue => ({
    archivo: nombre,
    aceptado: false,
    motivo,
    transformacion: transformacion || null,
    etiqueta: null,
    respuestas: null,
    descartadas: null,
    reemplazo: null,
  });

  // Una server action es un endpoint público: se puede invocar sin pasar por la
  // pantalla del PIN, así que la sesión se comprueba aquí también. Sin esto, el
  // PIN protegería la vista pero no la escritura en disco.
  if (!(await tieneAccesoAdmin())) {
    return fallo("La sesión venció. Vuelve a ingresar el PIN para cargar documentos.");
  }
  if (!(archivo instanceof File)) {
    return fallo("No se recibió ningún archivo.");
  }

  const contenido = Buffer.from(await archivo.arrayBuffer());
  const resultado = await guardarDocumentoMomento4(transformacion, archivo.name, contenido);

  // Solo si algo cambió en disco: revalidar sin necesidad haría recargar la
  // página por gusto tras un cargue rechazado.
  if (resultado.aceptado) revalidatePath("/admin");

  return resultado;
}
