import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { DistribucionValoracion } from "@/components/analitica-momentos/distribucion-valoracion";
import { esDistribucionLikert } from "@/lib/valoracion";
import { RespuestasAbiertas } from "@/components/analitica-momentos/respuestas-abiertas";
import { FeedForo } from "@/components/analitica-momentos/feed-foro";
import { formatNumero, formatPorcentaje } from "@/lib/formatters";
import {
  listarArchivosAnaliticaMomentos,
  obtenerAnaliticaMomento,
} from "@/repositories/datasource/analitica-momentos";

interface PageProps {
  params: Promise<{ slug: string }>;
}

function buscarArchivo(slug: string) {
  return listarArchivosAnaliticaMomentos().find((item) => item.slug === slug);
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const item = buscarArchivo(slug);
  return { title: item ? item.titulo : "Analítica actividades momentos" };
}

export default async function AnaliticaMomentoDetallePage({ params }: PageProps) {
  const { slug } = await params;
  const item = buscarArchivo(slug);
  if (!item) notFound();

  const datos = obtenerAnaliticaMomento(item.archivo);

  const kpis =
    datos.tipo === "foro"
      ? [{ etiqueta: "Personas que participaron", valor: datos.totalParticipantes }]
      : datos.tipo === "roster"
        ? [
            { etiqueta: "Número total de participantes", valor: datos.totalParticipantes },
            ...datos.preguntasValoracion.map((p) => ({
              etiqueta: `Valoraron: ${p.pregunta}`,
              valor: p.distribucion.reduce((suma, op) => suma + op.cantidad, 0),
            })),
          ]
        : [
            { etiqueta: "Número total de participantes", valor: datos.totalParticipantes },
            { etiqueta: "Personas que valoraron", valor: datos.totalRespondieron },
            {
              etiqueta: "% que valoraron",
              valor: datos.porcentajeRespondieron != null ? formatPorcentaje(datos.porcentajeRespondieron) : "—",
            },
          ];

  return (
    <div className="flex flex-col gap-5">
      <div>
        <Link
          href="/analitica-momentos"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
        >
          <ArrowLeft className="size-3.5" />
          Volver a Analítica actividades momentos
        </Link>
        <h1 className="mt-2 font-heading text-2xl font-bold text-foreground lg:text-3xl">{item.titulo}</h1>
      </div>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Indicadores principales">
        {kpis.map((kpi) => (
          <Card key={kpi.etiqueta} className="gap-0 py-0">
            <CardContent className="flex min-h-24 flex-col justify-center gap-1 px-4 py-4">
              <p className="text-xs font-medium leading-tight text-muted-foreground">{kpi.etiqueta}</p>
              <p className="font-heading text-2xl font-bold leading-none tabular-nums">
                {typeof kpi.valor === "number" ? formatNumero(kpi.valor) : kpi.valor}
              </p>
            </CardContent>
          </Card>
        ))}
      </section>

      {datos.preguntasValoracion.length > 0 ? (
        <section className="flex flex-col gap-3" aria-label="Distribución de valoración por pregunta">
          <p className="text-xs text-muted-foreground">
            {datos.preguntasValoracion.every((p) => esDistribucionLikert(p.distribucion)) ? (
              <>
                Cada gráfico resume las respuestas en una escala de valoración de{" "}
                <span className="font-medium text-foreground">1 (Muy bajo)</span> a{" "}
                <span className="font-medium text-foreground">5 (Muy alto)</span>.
              </>
            ) : (
              <>
                Valoraciones en una escala de <span className="font-medium text-foreground">1 a 5</span> (5 = máximo);
                los promedios se muestran como puntaje sobre 5.
              </>
            )}
          </p>
          <div className="grid gap-4 lg:grid-cols-2">
            {datos.preguntasValoracion.map((pregunta) => (
              <Card key={pregunta.pregunta}>
                <CardContent>
                  <DistribucionValoracion pregunta={pregunta} />
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      ) : null}

      {datos.preguntasAbiertas.length > 0 ? (
        <section className="grid gap-4 lg:grid-cols-2" aria-label="Respuestas abiertas">
          {datos.preguntasAbiertas.map((pregunta) => (
            <RespuestasAbiertas key={pregunta.pregunta} pregunta={pregunta} />
          ))}
        </section>
      ) : null}

      {datos.publicacionesForo.length > 0 ? (
        <section aria-label="Publicaciones del foro">
          <h2 className="mb-3 flex items-center gap-2 font-heading text-lg font-semibold text-foreground">
            <Users className="size-4 text-primary" aria-hidden />
            Publicaciones
          </h2>
          <FeedForo publicaciones={datos.publicacionesForo} />
        </section>
      ) : null}
    </div>
  );
}
