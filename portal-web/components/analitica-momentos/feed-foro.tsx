import { CornerDownRight, MessageCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatFecha } from "@/lib/formatters";
import type { PublicacionForo } from "@/repositories/datasource/analitica-momentos";

export function FeedForo({ publicaciones }: { publicaciones: PublicacionForo[] }) {
  return (
    <div className="flex flex-col gap-3">
      {publicaciones.map((post, i) => (
        <Card key={i} className="gap-0 py-0">
          <CardContent className="flex gap-3 px-4 py-3.5">
            <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
              {post.esPublicacionOriginal ? (
                <MessageCircle className="size-4" aria-hidden />
              ) : (
                <CornerDownRight className="size-4" aria-hidden />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="text-sm font-semibold text-foreground">{post.autor}</span>
                {post.sede ? (
                  <Badge variant="outline" className="text-[10px]">
                    {post.sede}
                  </Badge>
                ) : null}
                {post.fecha ? (
                  <span className="text-[11px] text-muted-foreground">{formatFecha(post.fecha)}</span>
                ) : null}
              </div>
              {post.facultad ? <p className="mt-0.5 text-[11px] text-muted-foreground">{post.facultad}</p> : null}
              <p className="mt-2 text-sm leading-relaxed text-foreground">{post.texto}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
