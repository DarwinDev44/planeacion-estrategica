"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * Registra el uso del portal: una visita por página abierta, una sesión por
 * pestaña y los clics sobre controles.
 *
 * Va montado una sola vez en el layout raíz y no en cada página: así cubre
 * todas las secciones —incluidas las que se agreguen— sin tocar ninguna, y no
 * convierte en dinámicas las páginas que hoy se prerenderizan, porque todo
 * ocurre en el navegador después de cargar.
 *
 * No envía nada de quien navega: solo la ruta, y el servidor la suma a un
 * contador por sección y día.
 */

/** Marca de sesión: una pestaña cuenta como una sesión, aunque vea 10 páginas. */
const CLAVE_SESION = "uso-sesion-registrada";

/** La vista de administración no se mide: es quien observa. */
const RUTAS_IGNORADAS = ["/admin"];

/**
 * Cada cuánto se vacía el acumulado de clics. Se agrupan en vez de enviarse de
 * a uno porque una sesión activa produce decenas: una petición por clic
 * multiplicaría el tráfico sin cambiar el número que se guarda.
 */
const INTERVALO_ENVIO_MS = 10_000;

export function RegistroUso() {
  const ruta = usePathname();
  const clicsPendientes = useRef(0);
  // La ruta se guarda en una referencia para que el envío diferido use la
  // sección en la que se hicieron los clics, no aquella a la que ya se navegó.
  const rutaActual = useRef(ruta);

  useEffect(() => {
    rutaActual.current = ruta;
    if (RUTAS_IGNORADAS.some((ignorada) => ruta.startsWith(ignorada))) return;

    const esSesionNueva = sessionStorage.getItem(CLAVE_SESION) !== "true";
    if (esSesionNueva) sessionStorage.setItem(CLAVE_SESION, "true");

    enviar(ruta, { visitas: 1, sesiones: esSesionNueva ? 1 : 0 });
  }, [ruta]);

  useEffect(() => {
    if (RUTAS_IGNORADAS.some((ignorada) => ruta.startsWith(ignorada))) return;

    function alHacerClic(evento: MouseEvent) {
      const destino = evento.target as HTMLElement | null;
      // Solo los clics sobre controles: contar cada punto de la pantalla no
      // distingue a quien trabaja con la sección de quien la deja abierta.
      if (destino?.closest("a, button, [role='option'], [role='tab'], input, select, summary")) {
        clicsPendientes.current += 1;
      }
    }

    function vaciar() {
      const cantidad = clicsPendientes.current;
      if (cantidad === 0) return;
      clicsPendientes.current = 0;
      enviar(rutaActual.current, { clics: cantidad });
    }

    document.addEventListener("click", alHacerClic, true);
    const temporizador = setInterval(vaciar, INTERVALO_ENVIO_MS);
    // Al cerrar o cambiar de pestaña se vacía lo pendiente: si no, los clics de
    // los últimos segundos se perderían siempre.
    const alOcultar = () => {
      if (document.visibilityState === "hidden") vaciar();
    };
    document.addEventListener("visibilitychange", alOcultar);

    return () => {
      document.removeEventListener("click", alHacerClic, true);
      document.removeEventListener("visibilitychange", alOcultar);
      clearInterval(temporizador);
      vaciar();
    };
  }, [ruta]);

  return null;
}

function enviar(
  seccion: string,
  incrementos: { visitas?: number; sesiones?: number; clics?: number }
) {
  const cuerpo = JSON.stringify({ seccion, ...incrementos });

  // sendBeacon sobrevive al cierre de la pestaña, que es justo cuando hay que
  // enviar los últimos clics; fetch se usa solo si el navegador no lo trae.
  if (typeof navigator !== "undefined" && navigator.sendBeacon) {
    navigator.sendBeacon("/api/metricas", new Blob([cuerpo], { type: "application/json" }));
    return;
  }
  void fetch("/api/metricas", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: cuerpo,
    keepalive: true,
  }).catch(() => {
    // Una métrica perdida no debe romper la navegación.
  });
}
