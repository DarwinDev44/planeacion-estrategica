"use client";

import { useMemo, useState } from "react";
import { ArrowUpDown, Download, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatFecha, formatNumero } from "@/lib/formatters";
import type { FilaExploracion } from "@/repositories/encuestaRepository";

type Columna = keyof Pick<
  FilaExploracion,
  "id" | "rolPrincipal" | "sede" | "facultad" | "programaOArea" | "cantidadRoles" | "fechaInicio"
>;

const COLUMNAS: { key: Columna; etiqueta: string }[] = [
  { key: "id", etiqueta: "ID" },
  { key: "rolPrincipal", etiqueta: "Rol principal" },
  { key: "sede", etiqueta: "Sede" },
  { key: "facultad", etiqueta: "Facultad" },
  { key: "programaOArea", etiqueta: "Programa / Área" },
  { key: "cantidadRoles", etiqueta: "Roles" },
  { key: "fechaInicio", etiqueta: "Fecha" },
];

const TAMANOS_PAGINA = [25, 50, 100];

function aCSV(filas: FilaExploracion[]): string {
  const encabezado = COLUMNAS.map((c) => c.etiqueta).join(",");
  const cuerpo = filas
    .map((f) =>
      COLUMNAS.map((c) => {
        const valor = f[c.key];
        const texto = valor == null ? "" : String(valor);
        return texto.includes(",") ? `"${texto.replace(/"/g, '""')}"` : texto;
      }).join(",")
    )
    .join("\n");
  return `${encabezado}\n${cuerpo}`;
}

function descargarCSV(filas: FilaExploracion[]) {
  const csv = aCSV(filas);
  const blob = new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `participacion-exploracion-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function ExplorationTable({ filas }: { filas: FilaExploracion[] }) {
  const [busqueda, setBusqueda] = useState("");
  const [orden, setOrden] = useState<{ col: Columna; dir: 1 | -1 }>({ col: "id", dir: 1 });
  const [pagina, setPagina] = useState(0);
  const [tamanoPagina, setTamanoPagina] = useState(25);

  const filtradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    let out = filas;
    if (q) {
      out = filas.filter((f) =>
        [f.rolPrincipal, f.sede, f.facultad, f.programaOArea].some((v) => v?.toLowerCase().includes(q))
      );
    }
    return [...out].sort((a, b) => {
      const va = a[orden.col];
      const vb = b[orden.col];
      if (va == null) return 1;
      if (vb == null) return -1;
      if (typeof va === "number" && typeof vb === "number") return (va - vb) * orden.dir;
      return String(va).localeCompare(String(vb), "es") * orden.dir;
    });
  }, [busqueda, filas, orden]);

  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / tamanoPagina));
  const paginaActual = Math.min(pagina, totalPaginas - 1);
  const visibles = filtradas.slice(paginaActual * tamanoPagina, (paginaActual + 1) * tamanoPagina);

  function alternarOrden(col: Columna) {
    setPagina(0);
    setOrden((prev) => (prev.col === col ? { col, dir: prev.dir === 1 ? -1 : 1 } : { col, dir: 1 }));
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={busqueda}
            onChange={(e) => {
              setBusqueda(e.target.value);
              setPagina(0);
            }}
            placeholder="Buscar por rol, sede, facultad o programa…"
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {formatNumero(filtradas.length)} de {formatNumero(filas.length)} registros
          </span>
          <Button variant="outline" size="sm" onClick={() => descargarCSV(filtradas)}>
            <Download className="size-3.5" />
            Exportar CSV
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              {COLUMNAS.map((c) => (
                <TableHead key={c.key}>
                  <button
                    type="button"
                    onClick={() => alternarOrden(c.key)}
                    className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground"
                  >
                    {c.etiqueta}
                    <ArrowUpDown className="size-3" aria-hidden />
                  </button>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibles.map((f) => (
              <TableRow key={f.id}>
                <TableCell className="tabular-nums">{f.id}</TableCell>
                <TableCell>{f.rolPrincipal}</TableCell>
                <TableCell>{f.sede ?? "—"}</TableCell>
                <TableCell className="max-w-[200px] truncate">{f.facultad ?? "—"}</TableCell>
                <TableCell className="max-w-[240px] truncate">{f.programaOArea ?? "—"}</TableCell>
                <TableCell className="tabular-nums">{f.cantidadRoles}</TableCell>
                <TableCell className="tabular-nums">{formatFecha(f.fechaInicio)}</TableCell>
              </TableRow>
            ))}
            {visibles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={COLUMNAS.length} className="py-8 text-center text-sm text-muted-foreground">
                  No hay registros que coincidan con la búsqueda.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
        <Select
          value={String(tamanoPagina)}
          onValueChange={(v) => {
            setTamanoPagina(Number(v));
            setPagina(0);
          }}
        >
          <SelectTrigger className="w-40" size="sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TAMANOS_PAGINA.map((t) => (
              <SelectItem key={t} value={String(t)}>
                {t} por página
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={paginaActual === 0} onClick={() => setPagina((p) => p - 1)}>
            Anterior
          </Button>
          <span className="text-xs text-muted-foreground">
            Página {paginaActual + 1} de {totalPaginas}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={paginaActual >= totalPaginas - 1}
            onClick={() => setPagina((p) => p + 1)}
          >
            Siguiente
          </Button>
        </div>
      </div>
    </div>
  );
}
