import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Montserrat, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/components/layout/app-providers";

// Debe ser >= al breakpoint Tailwind más alto usado en la app (xl = 1280px),
// para que sm/md/lg/xl siempre resuelvan a su estado desktop.
const ANCHO_ESCRITORIO = 1280;

/**
 * El <meta viewport> se fija SIEMPRE en 1280 (no `device-width`). Esto es
 * necesario, no cosmético: si se declarara `width=device-width` y luego
 * #app-frame tuviera `width:1280px` vía CSS, el navegador expandiría por su
 * cuenta el viewport para contener ese ancho — y entonces `window.innerWidth`
 * dejaría de reflejar el ancho real del dispositivo, invalidando cualquier
 * cálculo de escala hecho a partir de él (se probó y reprodujo este ciclo).
 * Fijar 1280 de entrada evita esa ambigüedad: el viewport siempre es 1280 en
 * móvil, sin importar el contenido.
 */
export const viewport: Viewport = {
  width: ANCHO_ESCRITORIO,
  initialScale: 1,
};

/**
 * Con el viewport ya anclado en 1280, `window.innerWidth` dejó de servir para
 * saber el ancho real del dispositivo (siempre da 1280). Se usa
 * `window.screen.width` en su lugar: es una propiedad de la pantalla física,
 * ajena a cualquier <meta viewport> o CSS de la página.
 *
 * Con esa medida se decide si el dispositivo es "móvil" (pantalla < 1280) y,
 * de serlo, se agrega la clase `forzar-escritorio` a <html> y se publica
 * `--escala-escritorio` (pantalla / 1280) como variable CSS. La regla
 * correspondiente en globals.css usa esa clase (no un media query — un media
 * query sobre el ancho del viewport caería en el mismo ciclo de arriba, ya
 * que el viewport está fijo en 1280) para poner #app-frame en
 * `width:1280px; zoom: var(--escala-escritorio)`.
 *
 * Se eligió `zoom` (no `transform: scale`) porque además de escalar
 * visualmente, `zoom` SÍ reduce el alto realmente ocupado en el documento
 * (transform no lo hace, dejaría un hueco en blanco debajo) y porque, al ser
 * una propiedad CSS que se reevalúa igual que cualquier otra en cada
 * resize/rotación, no depende de que el motor del navegador reinterprete el
 * <meta viewport> después de ya haber pintado — que es donde fallaba el
 * enfoque anterior (mutar `initial-scale` por JS tras la carga) de forma
 * intermitente en componentes que se remiden a sí mismos con ResizeObserver,
 * como los gráficos de recharts (`ResponsiveContainer`): al medir su
 * contenedor, siguen viendo el ancho real de 1280px — solo cambia la escala
 * con la que se pinta todo el conjunto — así que su layout interno ya no
 * varía entre dispositivos.
 */
const ESCALA_ESCRITORIO = `(() => {
  function actualizar() {
    var anchoPantalla = window.screen && window.screen.width;
    var esMovil = anchoPantalla > 0 && anchoPantalla < ${ANCHO_ESCRITORIO};
    document.documentElement.classList.toggle('forzar-escritorio', esMovil);
    var escala = esMovil ? anchoPantalla / ${ANCHO_ESCRITORIO} : 1;
    document.documentElement.style.setProperty('--escala-escritorio', String(escala));
  }
  actualizar();
  window.addEventListener('resize', actualizar);
  window.addEventListener('orientationchange', actualizar);
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
        <Script id="escala-escritorio" strategy="beforeInteractive">
          {ESCALA_ESCRITORIO}
        </Script>
        <div id="app-frame">
          <AppProviders>{children}</AppProviders>
        </div>
      </body>
    </html>
  );
}
