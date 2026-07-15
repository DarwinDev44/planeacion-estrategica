import { PanelSeguimiento } from "@/components/seguimiento/panel-seguimiento";
import cai from "@/data/cai.json";
import type { CaiData } from "@/types/cai";

const datos = cai as unknown as CaiData;

export default function SeguimientoActividadesPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-3xl font-bold text-foreground">
          Valoración de momentos
        </h1>
      </div>
      <PanelSeguimiento datos={datos} />
    </div>
  );
}
