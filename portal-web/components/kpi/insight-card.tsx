import { Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function InsightCard({ children }: { children: React.ReactNode }) {
  return (
    <Card className="border-primary/20 bg-secondary/60">
      <CardContent className="flex items-start gap-3 px-4 py-3">
        <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
        <p className="text-sm leading-relaxed text-foreground">{children}</p>
      </CardContent>
    </Card>
  );
}
