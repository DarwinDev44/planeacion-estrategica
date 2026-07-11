import { PanelSeguimiento } from "@/components/seguimiento/panel-seguimiento";
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
      </div>
      <PanelSeguimiento datos={datos} />
    </div>
  );
}
