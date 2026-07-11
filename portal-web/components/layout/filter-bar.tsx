"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFiltrosStore } from "@/store/filtros";
import { ETIQUETA_ROL_CORTA, FACULTADES_ORDENADAS, ROLES_ORDENADOS, SEDES_ORDENADAS } from "@/constants/marca";
import type { Rol, Sede } from "@/types/encuesta";

const TODAS = "__todas__";

export function FilterBar() {
  const { rol, sede, facultad, toggleRol, toggleSede, toggleFacultad, limpiar, hayFiltrosActivos } =
    useFiltrosStore();

  const rolActivo = rol?.[0] ?? TODAS;
  const sedeActiva = sede?.[0] ?? TODAS;
  const facultadActiva = facultad?.[0] ?? TODAS;
  const activo = hayFiltrosActivos();

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Campo etiqueta="Unidad Regional">
        <Select
          value={sedeActiva}
          onValueChange={(v) => {
            if (sede?.[0]) toggleSede(sede[0] as Sede);
            if (v && v !== TODAS) toggleSede(v as Sede);
          }}
        >
          <SelectTrigger size="sm" className="w-[160px] bg-card">
            <SelectValue placeholder="Todas">{(v: string | null) => (v && v !== TODAS ? v : "Todas")}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TODAS}>Todas</SelectItem>
            {SEDES_ORDENADAS.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Campo>

      <Campo etiqueta="Facultad / Área">
        <Select
          value={facultadActiva}
          onValueChange={(v) => {
            if (facultad?.[0]) toggleFacultad(facultad[0]);
            if (v && v !== TODAS) toggleFacultad(v);
          }}
        >
          <SelectTrigger size="sm" className="w-[220px] bg-card">
            <SelectValue placeholder="Todas">{(v: string | null) => (v && v !== TODAS ? v : "Todas")}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TODAS}>Todas</SelectItem>
            {FACULTADES_ORDENADAS.map((f) => (
              <SelectItem key={f} value={f}>
                {f}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Campo>

      <Campo etiqueta="Rol">
        <Select
          value={rolActivo}
          onValueChange={(v) => {
            if (rol?.[0]) toggleRol(rol[0] as Rol);
            if (v && v !== TODAS) toggleRol(v as Rol);
          }}
        >
          <SelectTrigger size="sm" className="w-[180px] bg-card">
            <SelectValue placeholder="Todos">
              {(v: string | null) => (v && v !== TODAS ? ETIQUETA_ROL_CORTA[v as Rol] : "Todos")}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TODAS}>Todos</SelectItem>
            {ROLES_ORDENADOS.map((r) => (
              <SelectItem key={r} value={r}>
                {ETIQUETA_ROL_CORTA[r]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Campo>

      {activo ? (
        <Button variant="ghost" size="sm" onClick={limpiar} className="text-muted-foreground">
          <X className="size-3.5" />
          Limpiar filtros
        </Button>
      ) : null}
    </div>
  );
}

function Campo({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{etiqueta}</span>
      {children}
    </div>
  );
}
