"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatNumero } from "@/lib/formatters";
import {
  OPCIONES_RESPALDO,
  clasificarRespaldo,
  estandarizarPrograma,
} from "@/lib/reglas/momento4";
import type { RespuestaMomento4 } from "@/types/momento4";

/** Cuántas filas se muestran antes de pedir "ver más". */
const PASO = 25;

const COLOR_POR_RESPALDO = new Map(OPCIONES_RESPALDO.map((o) => [o.id, o.color]));

/** El programa unificado, o null si esta respuesta no es de un graduado. */
const programa = (respuesta: RespuestaMomento4) =>
  estandarizarPrograma(respuesta.programaGraduado);

/**
 * Detalle fila por fila. Se pagina por bloques en vez de volcar todo de una:
 * con miles de respuestas, pintar la tabla completa deja la página pesada sin
 * que nadie vaya a leerla entera.
 */
export function TablaRespuestas({ respuestas }: { respuestas: RespuestaMomento4[] }) {
  const [visibles, setVisibles] = useState(PASO);
  const mostradas = respuestas.slice(0, visibles);

  if (respuestas.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Ninguna respuesta coincide con los filtros aplicados.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* `table-fixed` + anchos por columna: con layout automático, el correo y
          el tipo de actor (textos largos y sin espacios) ensanchan la tabla más
          allá de la tarjeta y las últimas columnas quedan fuera de vista. */}
      <Table className="table-fixed">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[13%] whitespace-normal">Nombre</TableHead>
            <TableHead className="w-[16%] whitespace-normal">Correo electrónico</TableHead>
            <TableHead className="w-[16%] whitespace-normal">Tipo de actor</TableHead>
            <TableHead className="w-[12%] whitespace-normal">Unidad Regional</TableHead>
            <TableHead className="w-[13%] whitespace-normal">Transformación</TableHead>
            <TableHead className="w-[12%] whitespace-normal">¿Responde?</TableHead>
            <TableHead className="w-[18%] whitespace-normal">¿Qué ajustarían?</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {mostradas.map((respuesta) => {
            const respaldo = clasificarRespaldo(respuesta.respondeNecesidad);
            return (
              <TableRow key={respuesta.id} className="align-top">
                <TableCell className="whitespace-normal font-medium">
                  {respuesta.nombre ?? "—"}
                </TableCell>
                {/* `break-all` solo en el correo: es la única cadena larga sin
                    espacios, así que sin esto se sale de su columna. */}
                <TableCell className="whitespace-normal break-all text-muted-foreground">
                  {respuesta.correo ?? "—"}
                </TableCell>
                <TableCell className="whitespace-normal text-muted-foreground">
                  {respuesta.tipoActor ?? "—"}
                  {/* El programa cuelga del tipo de actor y no ocupa columna
                      propia: solo lo traen los graduados, así que una columna
                      entera estaría vacía en la mayoría de las filas. */}
                  {programa(respuesta) ? (
                    <span className="mt-0.5 block text-xs text-muted-foreground/80">
                      {programa(respuesta)}
                    </span>
                  ) : null}
                </TableCell>
                <TableCell className="whitespace-normal text-muted-foreground">
                  {respuesta.unidadRegional ?? "—"}
                </TableCell>
                <TableCell className="whitespace-normal">{respuesta.etiqueta}</TableCell>
                <TableCell className="whitespace-normal">
                  {respuesta.respondeNecesidad ? (
                    <span className="inline-flex items-start gap-1.5">
                      <span
                        className="mt-1 size-2.5 shrink-0 rounded-full"
                        style={{ background: COLOR_POR_RESPALDO.get(respaldo) }}
                        aria-hidden
                      />
                      {respuesta.respondeNecesidad}
                    </span>
                  ) : (
                    "—"
                  )}
                </TableCell>
                {/* El único campo de texto libre. Se muestra completo al pasar
                    el cursor, pero acotado a tres líneas en la tabla: con los
                    aportes reales —párrafos de varias frases— una sola fila
                    llegaba a ocupar media pantalla y dejaba la tabla ilegible. */}
                <TableCell className="whitespace-normal text-muted-foreground">
                  {respuesta.ajustes ? (
                    <span className="line-clamp-3" title={respuesta.ajustes}>
                      {respuesta.ajustes}
                    </span>
                  ) : (
                    "—"
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          Mostrando {formatNumero(mostradas.length)} de {formatNumero(respuestas.length)} respuestas
        </p>
        {visibles < respuestas.length ? (
          <Button variant="outline" size="sm" onClick={() => setVisibles((v) => v + PASO * 2)}>
            Ver más
          </Button>
        ) : null}
      </div>
    </div>
  );
}
