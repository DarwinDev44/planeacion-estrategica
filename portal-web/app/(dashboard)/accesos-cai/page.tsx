import type { Metadata } from "next";
import { PanelAccesosCai } from "@/components/accesos/panel-accesos-cai";
import accesos from "@/data/accesos-cai.json";
import type { AccesosCaiData } from "@/types/accesos-cai";

export const metadata: Metadata = {
  title: "Accesos a CAI Planeación estratégica",
};

export default function AccesosCaiPage() {
  const datos = accesos as AccesosCaiData;

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="font-heading text-3xl font-bold text-foreground">
          Accesos a CAI Planeación estratégica
        </h1>
      </header>
      <PanelAccesosCai datos={datos} />
    </div>
  );
}
