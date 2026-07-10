import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RankedBarChart } from "@/components/charts/ranked-bar-chart";
import { SedeBarList } from "@/components/charts/sede-bar-list";
import { formatNumero, formatPorcentaje } from "@/lib/formatters";
import { COLOR_POR_ROL, ETIQUETA_ROL_CORTA } from "@/constants/marca";
import type { Rol } from "@/types/encuesta";
import {
  getKpisEjecutivos,
  getDistribucionRolPreagregada,
  getDistribucionSedePreagregada,
  getCombinacionesRolPreagregadas,
  getConteoPorFacultad,
} from "@/repositories/encuestaRepository";

export const metadata: Metadata = { title: "Quién participó" };

export default function ParticipacionPage() {
  const kpis = getKpisEjecutivos();
  const distribucionRol = getDistribucionRolPreagregada();
  const distribucionSede = getDistribucionSedePreagregada();
  const combinaciones = getCombinacionesRolPreagregadas();
  const conteoFacultad = getConteoPorFacultad();

  const rolDatos = Object.entries(distribucionRol)
    .map(([rol, conteo]) => ({
      etiqueta: ETIQUETA_ROL_CORTA[rol as Rol] ?? rol,
      conteo,
      porcentaje: Math.round((conteo / kpis.totalAsignacionesRol) * 1000) / 10,
    }))
    .sort((a, b) => b.conteo - a.conteo);
  const rolColores = Object.entries(distribucionRol)
    .sort(([, a], [, b]) => b - a)
    .map(([rol]) => COLOR_POR_ROL[rol as Rol]);

  const totalFacultades = conteoFacultad.reduce((acc, f) => acc + f.conteo, 0) || 1;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground lg:text-3xl">Quién participó</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Composición de los {formatNumero(kpis.totalParticipantes)} participantes por rol, sede, facultad y
          combinación de roles.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Distribución por rol (completo)</CardTitle>
          </CardHeader>
          <CardContent>
            <RankedBarChart titulo="" datos={rolDatos} colores={rolColores} alturaFila={44} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Distribución por sede</CardTitle>
          </CardHeader>
          <CardContent>
            <SedeBarList distribucion={distribucionSede} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Combinaciones de multi-rol</CardTitle>
            <p className="text-xs text-muted-foreground">
              {formatNumero(kpis.personasConMultiRol)} personas ({formatPorcentaje(
                Math.round((kpis.personasConMultiRol / kpis.totalParticipantes) * 1000) / 10
              )}) tienen más de un rol simultáneo en la universidad.
            </p>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Combinación de roles</TableHead>
                  <TableHead className="text-right">Personas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {combinaciones.map((c) => (
                  <TableRow key={c.combinacion}>
                    <TableCell className="text-sm">{c.combinacion}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatNumero(c.conteo)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Participantes por facultad</CardTitle>
            <p className="text-xs text-muted-foreground">Solo aplica a roles con vínculo académico.</p>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Facultad</TableHead>
                  <TableHead className="text-right">Personas</TableHead>
                  <TableHead className="text-right">%</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {conteoFacultad.map((f) => (
                  <TableRow key={f.facultad}>
                    <TableCell className="text-sm">{f.facultad}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatNumero(f.conteo)}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatPorcentaje(Math.round((f.conteo / totalFacultades) * 1000) / 10)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
