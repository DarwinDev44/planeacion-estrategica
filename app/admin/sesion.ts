import "server-only";
import { cookies } from "next/headers";
import { COOKIE_ADMIN } from "@/constants/admin";

/**
 * Si la sesión de /admin está validada. Vive aparte de `acciones.ts` porque
 * aquel archivo es "use server": todo lo que exporta se publica como acción
 * invocable desde el navegador, y esta comprobación no debe serlo.
 */
export async function tieneAccesoAdmin(): Promise<boolean> {
  return (await cookies()).get(COOKIE_ADMIN)?.value === "true";
}
