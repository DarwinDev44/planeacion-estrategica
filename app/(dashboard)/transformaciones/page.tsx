import type { Metadata } from "next";
import { AlertTriangle } from "lucide-react";
import { PanelTransformaciones } from "@/components/transformaciones/panel-transformaciones";
import { getRespuestasMomento4 } from "@/repositories/momento4Repository";
import { TITULO_MOMENTO4 } from "@/lib/reglas/momento4";
import type { RespuestaMomento4 } from "@/types/momento4";

export const metadata: Metadata = {
  title: "Trabajo en territorio con la comunidad universitaria",
};

/**
 * Sin prerenderizado: los datos se consultan en cada visita.
 *
 * Por defecto Next generaba esta página en el build, con dos consecuencias
 * malas: las respuestas quedaban congeladas en la versión desplegada —subir un
 * documento nuevo en /admin no cambiaría nada hasta el siguiente despliegue— y
 * el build pasaba a depender de que la base estuviera accesible y configurada,
 * así que un despliegue sin DATABASE_URL fallaría al compilar en vez de avisar
 * en pantalla. Es el mismo criterio que el resto del sitio con sus Excel: el
 * dato es siempre el de la siguiente petición.
 */
export const dynamic = "force-dynamic";

/**
 * Momento 4. A diferencia del resto de secciones, sus datos no salen de un
 * Excel en vivo sino de Postgres —única excepción a la regla del proyecto,
 * explicada en las reglas de la raíz—: se actualizan subiendo los documentos
 * desde la vista de administración, y aquí solo se leen.
 */
export default async function TransformacionesPage() {
  let respuestas: RespuestaMomento4[] = [];
  let error: string | null = null;
  try {
    respuestas = await getRespuestasMomento4();
  } catch (fallo) {
    error = fallo instanceof Error ? fallo.message : "No se pudo consultar la base de datos.";
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-bold text-foreground">{TITULO_MOMENTO4}</h1>
        <p className="text-sm text-muted-foreground">
          Valoración de las cinco transformaciones por parte de la comunidad universitaria: quién
          participó, qué tanto respalda cada transformación y qué ajustes propone.
        </p>
      </header>

      {error ? (
        <div className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden />
          <div>
            <p className="font-medium text-foreground">No se pudieron cargar las respuestas.</p>
            <p className="text-muted-foreground">{error}</p>
          </div>
        </div>
      ) : respuestas.length === 0 ? (
        <p className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          Todavía no hay respuestas cargadas. Se publican subiendo los documentos de las cinco
          transformaciones desde la vista de administración.
        </p>
      ) : (
        <PanelTransformaciones respuestas={respuestas} />
      )}
    </div>
  );
}
