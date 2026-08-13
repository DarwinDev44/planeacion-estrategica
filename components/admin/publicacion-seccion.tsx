"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { cambiarPublicacionSeccion } from "@/app/admin/acciones";

/**
 * Interruptor de publicación de una sección. El estado que se pinta es el que
 * devuelve el servidor tras guardar, no el que se supuso al pulsar: si el
 * cambio falla, el botón no debe quedarse mostrando algo que no ocurrió.
 */
export function PublicacionSeccion({
  seccion,
  titulo,
  descripcion,
  publicada,
}: {
  seccion: string;
  titulo: string;
  descripcion: string;
  publicada: boolean;
}) {
  const router = useRouter();
  const [estado, setEstado] = useState(publicada);
  const [error, setError] = useState<string | null>(null);
  const [guardando, iniciarGuardado] = useTransition();

  function alternar() {
    setError(null);
    iniciarGuardado(async () => {
      try {
        const respuesta = await cambiarPublicacionSeccion(seccion, !estado);
        setEstado(respuesta.publicada);
        if (!respuesta.ok) setError(respuesta.motivo ?? "No se pudo guardar el cambio.");
        else router.refresh();
      } catch {
        setError("No se pudo completar el cambio: el servidor no respondió correctamente.");
      }
    });
  }

  return (
    <Card className="border-border/70">
      <CardHeader>
        <CardTitle className="flex items-center gap-2.5">
          Publicación de la sección
          <Badge variant={estado ? "default" : "secondary"}>
            {estado ? "Visible para todos" : "Oculta"}
          </Badge>
        </CardTitle>
        <CardDescription>
          Controla si “{titulo}” se muestra en el sitio. Al desactivarla desaparece del menú y su
          dirección deja de responder, también para quien tenga el enlace guardado. Los datos no se
          borran: vuelven a verse al activarla de nuevo.
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-4 rounded-lg border border-border/70 bg-muted/40 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <span
              className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-lg",
                estado ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
              )}
            >
              {estado ? <Eye className="size-4" aria-hidden /> : <EyeOff className="size-4" aria-hidden />}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">{titulo}</p>
              <p className="text-xs text-muted-foreground">{descripcion}</p>
            </div>
          </div>

          <Button
            type="button"
            size="lg"
            variant={estado ? "outline" : "default"}
            disabled={guardando}
            onClick={alternar}
            aria-pressed={estado}
          >
            {guardando ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : estado ? (
              <EyeOff className="size-4" aria-hidden />
            ) : (
              <Eye className="size-4" aria-hidden />
            )}
            {guardando ? "Guardando…" : estado ? "Desactivar" : "Activar"}
          </Button>
        </div>

        {error ? (
          <p
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-muted-foreground"
          >
            <XCircle className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden />
            {error}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
