import type { Metadata } from "next";
import { FormularioPin } from "@/components/admin/formulario-pin";
import { CargueMomento4 } from "@/components/admin/cargue-momento4";
import { PublicacionSeccion } from "@/components/admin/publicacion-seccion";
import { getDocumentosMomento4 } from "@/repositories/momento4Repository";
import { estaSeccionPublicada } from "@/repositories/seccionesRepository";
import { SECCION_TRANSFORMACIONES } from "@/constants/secciones";
import { TITULO_MOMENTO4 } from "@/lib/reglas/momento4";
import type { DocumentoMomento4 } from "@/types/momento4";
import { tieneAccesoAdmin } from "./sesion";

export const metadata: Metadata = {
  title: "Administración",
};

/**
 * Vista administrativa: vive fuera del route group "(dashboard)" a propósito,
 * para no heredar su <AppShell> (barra lateral + encabezado del panel) — no es
 * un módulo más del panel, sino una sección aparte con su propio acceso. No se
 * enlaza desde ninguna parte del sitio: se entra escribiendo /admin en la URL.
 *
 * La puerta se decide aquí, en el servidor: sin la cookie de sesión, el
 * contenido ni siquiera se envía al navegador.
 */
export default async function AdminPage() {
  if (!(await tieneAccesoAdmin())) return <FormularioPin />;

  // Si la base no responde, la vista lo dice en su sitio en vez de devolver un
  // error 500 sin explicación: quien administra necesita saber si el problema
  // es su archivo o la conexión.
  let documentos: DocumentoMomento4[] = [];
  let error: string | null = null;
  try {
    documentos = await getDocumentosMomento4();
  } catch (fallo) {
    error = fallo instanceof Error ? fallo.message : "No se pudo consultar la base de datos.";
  }

  // No se envuelve en el try anterior: si fallara la consulta de documentos, el
  // interruptor de publicación sigue siendo utilizable.
  const publicada = await estaSeccionPublicada(SECCION_TRANSFORMACIONES);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-8 py-8">
      <h1 className="font-heading text-2xl font-semibold text-foreground">Administración</h1>
      <PublicacionSeccion
        seccion={SECCION_TRANSFORMACIONES}
        titulo={TITULO_MOMENTO4}
        descripcion="Sección del panel con la valoración de las cinco transformaciones."
        publicada={publicada}
      />
      <CargueMomento4 documentos={documentos} error={error} />
    </main>
  );
}
