import type { Metadata } from "next";
import { FormularioPin } from "@/components/admin/formulario-pin";
import { CargueMomento4 } from "@/components/admin/cargue-momento4";
import { CargueParticipacion } from "@/components/admin/cargue-participacion";
import { CargueAportes } from "@/components/admin/cargue-aportes";
import { PublicacionSeccion } from "@/components/admin/publicacion-seccion";
import { PanelUso } from "@/components/admin/panel-uso";
import { getDocumentosMomento4 } from "@/repositories/momento4Repository";
import { getDocumentosParticipacion } from "@/repositories/participacionRepository";
import { getDocumentoAportes } from "@/repositories/aportesRepository";
import { estaSeccionPublicada } from "@/repositories/seccionesRepository";
import { getMetricasUso } from "@/repositories/metricasRepository";
import { SECCION_PARTICIPACION, SECCION_TRANSFORMACIONES } from "@/constants/secciones";
import { TITULO_MOMENTO4 } from "@/lib/reglas/momento4";
import { TITULO_PARTICIPACION } from "@/lib/reglas/participacion";
import type { DocumentoMomento4 } from "@/types/momento4";
import type { DocumentoParticipacion } from "@/types/participacion";
import type { DocumentoAportes } from "@/types/aportes";
import { tieneAccesoAdmin } from "./sesion";

export const metadata: Metadata = {
  title: "Administración",
};

/** Rango que muestra el tablero de uso al abrir la página. */
const DIAS_INICIALES = 30;

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

  let documentoAportes: DocumentoAportes | null = null;
  let errorAportes: string | null = null;
  try {
    documentoAportes = await getDocumentoAportes();
  } catch (fallo) {
    errorAportes = fallo instanceof Error ? fallo.message : "No se pudo consultar la base de datos.";
  }

  let documentosParticipacion: DocumentoParticipacion[] = [];
  let errorParticipacion: string | null = null;
  try {
    documentosParticipacion = await getDocumentosParticipacion();
  } catch (fallo) {
    errorParticipacion =
      fallo instanceof Error ? fallo.message : "No se pudo consultar la base de datos.";
  }

  // No se envuelve en el try anterior: si fallara la consulta de documentos, el
  // interruptor de publicación sigue siendo utilizable.
  const publicada = await estaSeccionPublicada(SECCION_TRANSFORMACIONES);
  const publicadaParticipacion = await estaSeccionPublicada(SECCION_PARTICIPACION);

  // El tablero se resuelve aparte y con su propio try: un fallo midiendo el uso
  // no debe impedir administrar los documentos, que es lo importante.
  let metricas = null;
  try {
    metricas = await getMetricasUso(DIAS_INICIALES);
  } catch {
    metricas = null;
  }

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
      <CargueAportes documento={documentoAportes} error={errorAportes} />

      <PublicacionSeccion
        seccion={SECCION_PARTICIPACION}
        titulo={TITULO_PARTICIPACION}
        descripcion="Sección con el seguimiento de asistencia a las actividades en territorio."
        publicada={publicadaParticipacion}
      />
      <CargueParticipacion documentos={documentosParticipacion} error={errorParticipacion} />

      {metricas ? <PanelUso metricasIniciales={metricas} diasIniciales={DIAS_INICIALES} /> : null}
    </main>
  );
}
