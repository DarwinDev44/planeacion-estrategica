"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { COOKIE_ADMIN, DURACION_ACCESO_MINUTOS } from "@/constants/admin";
import type { ResultadoCargue } from "@/types/momento4";
import {
  eliminarRegistrosMomento4,
  guardarDocumentoMomento4,
} from "@/repositories/momento4Repository";
import { TRANSFORMACIONES_MOMENTO4 } from "@/lib/reglas/momento4";
import { publicarSeccion } from "@/repositories/seccionesRepository";
import { RUTA_POR_SECCION, SECCION_TRANSFORMACIONES } from "@/constants/secciones";
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
 * Borra los registros del Momento 4: los de una transformación, o los de todas
 * si se pasa null. Solo se borran filas — las tablas y su estructura se quedan,
 * para que el siguiente cargue funcione sin volver a migrar.
 */
export async function eliminarRegistros(
  idTransformacion: string | null
): Promise<{ ok: boolean; eliminadas: number; motivo: string }> {
  // Igual que el cargue: la sesión se comprueba aquí porque una server action
  // es un endpoint público. Sin esto, cualquiera podría vaciar la base.
  if (!(await tieneAccesoAdmin())) {
    return {
      ok: false,
      eliminadas: 0,
      motivo: "La sesión venció. Vuelve a ingresar el PIN para borrar registros.",
    };
  }
  if (idTransformacion && !TRANSFORMACIONES_MOMENTO4.some((t) => t.id === idTransformacion)) {
    return { ok: false, eliminadas: 0, motivo: "Esa transformación no existe." };
  }

  try {
    const eliminadas = await eliminarRegistrosMomento4(idTransformacion);
    revalidatePath("/admin");
    revalidatePath(RUTA_POR_SECCION[SECCION_TRANSFORMACIONES]);
    return {
      ok: true,
      eliminadas,
      motivo: idTransformacion
        ? `Se borraron ${eliminadas} respuesta(s) de esa transformación.`
        : `Se borraron ${eliminadas} respuesta(s) de las cinco transformaciones.`,
    };
  } catch (error) {
    return {
      ok: false,
      eliminadas: 0,
      motivo: `No se pudo borrar: ${error instanceof Error ? error.message : "error desconocido"}`,
    };
  }
}

/**
 * Publica o retira una sección del sitio. Devuelve el estado que quedó
 * guardado, para que la pantalla refleje lo que hay en la base y no lo que
 * creía tener antes de pulsar.
 */
export async function cambiarPublicacionSeccion(
  seccion: string,
  publicada: boolean
): Promise<{ ok: boolean; publicada: boolean; motivo?: string }> {
  // Igual que el cargue: una server action se puede invocar sin pasar por la
  // pantalla del PIN, así que la sesión se comprueba aquí también.
  if (!(await tieneAccesoAdmin())) {
    return {
      ok: false,
      publicada,
      motivo: "La sesión venció. Vuelve a ingresar el PIN para cambiar la publicación.",
    };
  }
  if (!(seccion in RUTA_POR_SECCION)) {
    return { ok: false, publicada, motivo: "Esa sección no existe." };
  }

  try {
    const estado = await publicarSeccion(seccion, publicada);
    // La ruta de la sección y el layout del panel: la primera deja de responder
    // 404 (o vuelve a hacerlo) y el segundo pinta el menú lateral, del que hay
    // que quitar o devolver el enlace.
    revalidatePath(RUTA_POR_SECCION[seccion]);
    revalidatePath("/", "layout");
    return { ok: true, publicada: estado };
  } catch (error) {
    return {
      ok: false,
      publicada,
      motivo: `No se pudo guardar el cambio: ${error instanceof Error ? error.message : "error desconocido"}`,
    };
  }
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
    descartadasPorFecha: null,
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
