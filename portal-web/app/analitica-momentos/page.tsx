import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, FileSpreadsheet } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  listarArchivosAnaliticaMomentos,
  type ArchivoAnaliticaMomentos,
} from "@/repositories/datasource/analitica-momentos";

export const metadata: Metadata = {
  title: "Analítica actividades momentos",
};

export default function AnaliticaMomentosPage() {
  const archivos = listarArchivosAnaliticaMomentos();

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="font-heading text-2xl font-bold text-foreground lg:text-3xl">
          Analítica actividades momentos
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Valoración por actividad y momento. Selecciona una tarjeta para ver su análisis.
        </p>
      </header>
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3" aria-label="Actividades y momentos">
        {archivos.map((item) => (
          <TarjetaActividad key={item.archivo} item={item} />
        ))}
      </section>
    </div>
  );
}

function TarjetaActividad({ item }: { item: ArchivoAnaliticaMomentos }) {
  return (
    <Link href={`/analitica-momentos/${item.slug}`}>
      <Card className="gap-0 py-0 transition-colors hover:bg-accent">
        <CardContent className="flex items-center gap-3.5 px-4 py-3.5">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
            <FileSpreadsheet className="size-5" aria-hidden />
          </span>
          <span className="min-w-0 flex-1 text-sm font-semibold text-foreground">{item.titulo}</span>
          <ArrowRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        </CardContent>
      </Card>
    </Link>
  );
}
