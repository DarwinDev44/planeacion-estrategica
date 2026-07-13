"use client";

import { forwardRef, useCallback, useEffect, useImperativeHandle, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ConferencistaCard } from "@/components/conferencistas/conferencista-card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ConferenciaConValoracion } from "@/types/conferencistas";

export interface CarouselConferencistasHandle {
  irA: (id: number) => void;
}

/**
 * Carrusel con 4 cards visibles siempre — sin puntos de quiebre responsive:
 * el resto de la aplicación fuerza el layout de escritorio en cualquier
 * dispositivo (ver app/layout.tsx), así que este carrusel se ve y se maneja
 * igual en un teléfono que en un monitor, ya escalado por ese mecanismo.
 */
export const CarouselConferencistas = forwardRef<
  CarouselConferencistasHandle,
  {
    conferencias: ConferenciaConValoracion[];
    onSeleccionar: (conferencia: ConferenciaConValoracion) => void;
    resaltadaId: number | null;
  }
>(function CarouselConferencistas({ conferencias, onSeleccionar, resaltadaId }, ref) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    containScroll: "trimSnaps",
    duration: 24,
  });
  const [snapSeleccionado, setSnapSeleccionado] = useState(0);
  const [totalSnaps, setTotalSnaps] = useState<number[]>([]);
  const [puedeAnterior, setPuedeAnterior] = useState(false);
  const [puedeSiguiente, setPuedeSiguiente] = useState(false);

  const sincronizar = useCallback(() => {
    if (!emblaApi) return;
    setSnapSeleccionado(emblaApi.selectedScrollSnap());
    setPuedeAnterior(emblaApi.canScrollPrev());
    setPuedeSiguiente(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    setTotalSnaps(emblaApi.scrollSnapList());
    sincronizar();
    emblaApi.on("select", sincronizar);
    emblaApi.on("reInit", sincronizar);
    return () => {
      emblaApi.off("select", sincronizar);
      emblaApi.off("reInit", sincronizar);
    };
  }, [emblaApi, sincronizar]);

  useImperativeHandle(
    ref,
    () => ({
      irA(id: number) {
        const indice = conferencias.findIndex((c) => c.id === id);
        if (indice >= 0) emblaApi?.scrollTo(indice);
      },
    }),
    [emblaApi, conferencias]
  );

  return (
    <div className="relative">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="-ml-4 flex">
          {conferencias.map((c) => (
            <div key={c.id} className="min-w-0 flex-[0_0_25%] pl-4">
              <ConferencistaCard
                conferencia={c}
                onSeleccionar={onSeleccionar}
                resaltada={resaltadaId === c.id}
                className="h-full"
              />
            </div>
          ))}
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => emblaApi?.scrollPrev()}
        disabled={!puedeAnterior}
        aria-label="Conferencista anterior"
        className="absolute top-[42%] -left-4 z-10 size-9 -translate-y-1/2 rounded-full border-border bg-card shadow-md disabled:opacity-0"
      >
        <ChevronLeft className="size-4" aria-hidden />
      </Button>
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => emblaApi?.scrollNext()}
        disabled={!puedeSiguiente}
        aria-label="Siguiente conferencista"
        className="absolute top-[42%] -right-4 z-10 size-9 -translate-y-1/2 rounded-full border-border bg-card shadow-md disabled:opacity-0"
      >
        <ChevronRight className="size-4" aria-hidden />
      </Button>

      {totalSnaps.length > 1 ? (
        <div className="mt-4 flex items-center justify-center gap-1.5">
          {totalSnaps.map((_, indice) => (
            <button
              key={indice}
              type="button"
              onClick={() => emblaApi?.scrollTo(indice)}
              aria-label={`Ir al grupo ${indice + 1} de conferencistas`}
              aria-current={indice === snapSeleccionado}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                indice === snapSeleccionado ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/25 hover:bg-muted-foreground/50"
              )}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
});
