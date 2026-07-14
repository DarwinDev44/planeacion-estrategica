import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Empaqueta un servidor Node mínimo y autocontenido en .next/standalone —
  // base de la distribución portable (exe). Solo se activa con
  // BUILD_STANDALONE=1 para no alterar el build normal que usa Vercel.
  output: process.env.BUILD_STANDALONE === "1" ? "standalone" : undefined,
  // Permite el query param ?v= en imágenes locales de /public (usado como
  // cache-busting manual: el nombre de archivo no cambia entre ediciones de
  // imagen, así que sin esto los navegadores seguirían sirviendo la versión
  // cacheada tras reemplazar el archivo).
  images: {
    // "/**" cubre TODAS las imágenes locales de /public (logos, fotos de
    // conferencistas, etc.) — restringirlo a una sola carpeta rompe el resto
    // del sitio, ya que localPatterns funciona como lista blanca completa.
    // Sin la clave "search" no se exige que la URL venga sin query string,
    // así el ?v= de cache-busting también pasa.
    localPatterns: [{ pathname: "/**" }],
  },
  // Asegura que los .xlsx (fuente de datos en vivo, leídos con fs en el
  // servidor) queden incluidos en el bundle serverless — de otra forma el
  // file-tracing automático de Vercel podría omitirlos por no ser código.
  outputFileTracingIncludes: {
    "/*": [
      "./data/source/**",
      "./data/source-metas/**",
      "./data/source-conferencistas/**",
      "./data/source-valoraciones/**",
      "./data/source-analitica-momentos/**",
    ],
  },
};

export default nextConfig;
