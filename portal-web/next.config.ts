import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Permite el query param ?v= en imágenes locales de /public (usado como
  // cache-busting manual: el nombre de archivo no cambia entre ediciones de
  // imagen, así que sin esto los navegadores seguirían sirviendo la versión
  // cacheada tras reemplazar el archivo).
  images: {
    localPatterns: [{ pathname: "/assets/campana/**", search: "" }],
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
    ],
  },
};

export default nextConfig;
