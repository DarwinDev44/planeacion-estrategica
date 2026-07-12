import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
