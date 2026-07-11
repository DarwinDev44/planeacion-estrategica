"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatNumero, formatPorcentajeMetas } from "@/lib/formatters";
import type { TablaMeta } from "@/types/metas";

const UMBRAL_BUSCADOR = 12;

export function TablaMetaCard({ tabla }: { tabla: TablaMeta }) {
  const [busqueda, setBusqueda] = useState("");
  const conBuscador = tabla.filas.length > UMBRAL_BUSCADOR;

  const filtradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return tabla.filas;
    return tabla.filas.filter((f) => f.etiqueta.toLowerCase().includes(q));
  }, [busqueda, tabla.filas]);

  const [primeraCol, segundaCol] = tabla.ordenColumnas;

  return (
    <Card className="py-3">
      <CardHeader className="px-3.5 pb-1">
        <CardTitle className="text-[13px]">{tabla.titulo}</CardTitle>
        {tabla.subtitulo ? <CardDescription className="text-[11px]">{tabla.subtitulo}</CardDescription> : null}
      </CardHeader>
      <CardContent className="px-3.5">
        {conBuscador ? (
          <div className="relative mb-2">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder={`Buscar en ${tabla.columnaEtiqueta.toLowerCase()}…`}
              className="h-8 pl-8 text-xs"
              aria-label={`Buscar en ${tabla.columnaEtiqueta}`}
            />
          </div>
        ) : null}
        <div className={conBuscador ? "max-h-[360px] overflow-y-auto rounded-md border border-border" : "overflow-x-auto"}>
          <Table>
            <TableHeader className={conBuscador ? "sticky top-0 z-10 bg-card" : undefined}>
              <TableRow>
                <TableHead className="text-[11px]">{tabla.columnaEtiqueta}</TableHead>
                <TableHead className="text-right text-[11px] uppercase">{primeraCol}</TableHead>
                <TableHead className="text-right text-[11px] uppercase">{segundaCol}</TableHead>
                <TableHead className="text-right text-[11px]">Total general</TableHead>
                <TableHead className="text-right text-[11px]">Porcentaje</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtradas.map((f, i) => (
                <TableRow key={`${f.etiqueta}-${i}`}>
                  <TableCell className="max-w-[280px] text-[12px] leading-snug whitespace-normal">
                    {f.etiqueta}
                  </TableCell>
                  <TableCell className="text-right text-[12px] tabular-nums">
                    {formatNumero(primeraCol === "no" ? f.no : f.si)}
                  </TableCell>
                  <TableCell className="text-right text-[12px] tabular-nums">
                    {formatNumero(segundaCol === "no" ? f.no : f.si)}
                  </TableCell>
                  <TableCell className="text-right text-[12px] font-medium tabular-nums">
                    {formatNumero(f.total)}
                  </TableCell>
                  <TableCell className="text-right text-[12px] tabular-nums">
                    {formatPorcentajeMetas(f.porcentaje)}
                  </TableCell>
                </TableRow>
              ))}
              {filtradas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-6 text-center text-[12px] text-muted-foreground">
                    No hay resultados que coincidan con la búsqueda.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>
        {conBuscador ? (
          <p className="mt-1.5 text-[11px] text-muted-foreground">
            {filtradas.length} de {tabla.filas.length} filas
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
