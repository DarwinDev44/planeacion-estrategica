import { PanelSeguimiento } from "@/components/seguimiento/panel-seguimiento";
import { formatNumero } from "@/lib/formatters";
import cai from "@/data/cai.json";
import type { CaiData } from "@/types/cai";

const datos = cai as unknown as CaiData;

export default function SeguimientoActividadesPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground lg:text-3xl">
          Seguimiento participación actividades
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Comité de Apoyo Institucional · corte al 9 de julio de 2026 ·{" "}
          {formatNumero(datos.totalParticipantes)} participantes
        </p>
      </div>
      <PanelSeguimiento datos={datos} />
    </div>
  );
}
