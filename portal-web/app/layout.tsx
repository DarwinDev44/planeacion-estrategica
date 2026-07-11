import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Montserrat, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/components/layout/app-providers";

// Ancho de layout fijo (px) al que se fuerza toda la interfaz. Debe ser >= al
// breakpoint más alto usado en la app (xl = 1280) para que todo resuelva a su
// estado de escritorio.
const ANCHO_ESCRITORIO = 1280;

// En móvil, el meta viewport que emite Next trae `initial-scale=1`, lo que
// mostraría la maqueta de 1280px a escala 1:1 (recortada, con scroll). Este
// script se ejecuta antes de pintar y recalcula la escala inicial para que la
// composición de escritorio completa se encaje exactamente al ancho del
// dispositivo. En escritorio no aplica: los navegadores de escritorio ignoran
// el meta viewport, y la condición `screen.width < ANCHO` los excluye.
const AJUSTE_VIEWPORT_ESCRITORIO = `(() => {
  try {
    var anchoDispositivo = window.screen && window.screen.width;
    if (!anchoDispositivo || anchoDispositivo >= ${ANCHO_ESCRITORIO}) return;
    var escala = anchoDispositivo / ${ANCHO_ESCRITORIO};
    var contenido = 'width=${ANCHO_ESCRITORIO}, initial-scale=' + escala;
    var meta = document.querySelector('meta[name="viewport"]');
    if (!meta) { meta = document.createElement('meta'); meta.name = 'viewport'; document.head.appendChild(meta); }
    meta.setAttribute('content', contenido);
  } catch (e) {}
})();`;

const montserrat = Montserrat({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Participación, tu voz es fundamental | Universidad de Cundinamarca",
    template: "%s | Participación UCundinamarca",
  },
  description:
    "Portal de visualización estratégica institucional: explora los resultados del diagnóstico de participación para la construcción del Plan Estratégico de la Universidad de Cundinamarca.",
};

/**
 * Viewport de ancho fijo para que TODOS los dispositivos rendericen exactamente
 * la misma interfaz de escritorio. Al declarar un ancho de layout fijo, los
 * breakpoints de Tailwind (sm/md/lg/xl) siempre resuelven a su estado desktop;
 * el script `AJUSTE_VIEWPORT_ESCRITORIO` completa el efecto encajando esa
 * maqueta al ancho real del dispositivo en móvil.
 */
export const viewport: Viewport = {
  width: ANCHO_ESCRITORIO,
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es-CO"
      className={`${montserrat.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Script id="ajuste-viewport-escritorio" strategy="beforeInteractive">
          {AJUSTE_VIEWPORT_ESCRITORIO}
        </Script>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
