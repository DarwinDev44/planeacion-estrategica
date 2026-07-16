import type { Metadata } from "next";
import { LandingClient } from "@/components/landing/landing-client";

export const metadata: Metadata = {
  title: "Plan Estratégico 2027 – 2037",
};

export default function InicioPage() {
  return <LandingClient />;
}
