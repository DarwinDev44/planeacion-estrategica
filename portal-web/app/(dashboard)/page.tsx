import Link from "next/link";
import { Users, UserCog, MapPin, GraduationCap, Layers, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KpiCard } from "@/components/kpi/kpi-card";
import { InsightCard } from "@/components/kpi/insight-card";
import { RankedBarChart } from "@/components/charts/ranked-bar-chart";
import { TimeSeriesChart } from "@/components/charts/time-series-chart";
import { SedeBarList } from "@/components/charts/sede-bar-list";
import { formatFecha, formatNumero, formatPorcentaje } from "@/lib/formatters";
import { COLOR_POR_ROL, ETIQUETA_ROL_CORTA } from "@/constants/marca";
import { PREGUNTAS } from "@/constants/preguntas";
import type { Rol } from "@/types/encuesta";
import {
  getKpisEjecutivos,
  getDistribucionRolPreagregada,
  getDistribucionSedePreagregada,
  getRankingPreguntasPreagregado,
  getSerieTiempoPreagregada,
} from "@/repositories/encuestaRepository";

export default function ResumenEjecutivoPage() {
  const kpis = getKpisEjecutivos();
  const distribucionRol = getDistribucionRolPreagregada();
  const distribucionSede = getDistribucionSedePreagregada();
  const rankingPreguntas = getRankingPreguntasPreagregado();
  const serieTiempo = getSerieTiempoPreagregada();

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

  const opcionTop1 = rankingPreguntas.P1[0];
  const picoParticipacion = [...serieTiempo].sort((a, b) => b.conteo - a.conteo)[0];
  const porcentajeMultiRol = Math.round((kpis.personasConMultiRol / kpis.totalParticipantes) * 1000) / 10;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground lg:text-3xl">Resumen ejecutivo</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Participación institucional del {kpis.ventanaTemporal.desde ? formatFecha(kpis.ventanaTemporal.desde) : "—"}{" "}
          al {kpis.ventanaTemporal.hasta ? formatFecha(kpis.ventanaTemporal.hasta) : "—"}
        </p>
      </div>

      {/* Franja de KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <KpiCard etiqueta="Participantes" valor={formatNumero(kpis.totalParticipantes)} icono={Users} />
        <KpiCard
          etiqueta="Asignaciones de rol"
          valor={formatNumero(kpis.totalAsignacionesRol)}
          detalle="una persona puede tener varios roles"
          icono={UserCog}
        />
        <KpiCard etiqueta="Sedes con participación" valor={`${kpis.sedesConParticipacion}/8`} icono={MapPin} />
        <KpiCard
          etiqueta="Programas representados"
          valor={formatNumero(kpis.programasRepresentados)}
          icono={GraduationCap}
        />
        <KpiCard
          etiqueta="Con más de un rol"
          valor={formatNumero(kpis.personasConMultiRol)}
          detalle={`${formatPorcentaje(porcentajeMultiRol)} del total`}
          icono={Layers}
        />
      </div>

      {/* Distribución por rol y por sede */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Distribución por rol</CardTitle>
          </CardHeader>
          <CardContent>
            <RankedBarChart
              titulo=""
              datos={rolDatos}
              colores={rolColores}
              alturaFila={44}
            />
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

      {/* Evolución temporal */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Evolución de la participación</CardTitle>
          <p className="text-xs text-muted-foreground">
            La campaña se desarrolló en olas de convocatoria, no de forma continua — el pico principal fue el{" "}
            {picoParticipacion ? formatFecha(picoParticipacion.fecha) : "—"} con{" "}
            {picoParticipacion ? formatNumero(picoParticipacion.conteo) : "—"} respuestas en un solo día.
          </p>
        </CardHeader>
        <CardContent>
          <TimeSeriesChart datos={serieTiempo} />
        </CardContent>
      </Card>

      {/* Lo que la comunidad prioriza */}
      <div>
        <h2 className="font-heading text-lg font-semibold text-foreground">Lo que la comunidad prioriza</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Top de opciones seleccionadas en cada una de las 4 preguntas estratégicas de la encuesta.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {PREGUNTAS.map((pregunta) => (
            <Card key={pregunta.id}>
              <CardHeader>
                <CardTitle className="text-sm font-semibold leading-snug">{pregunta.texto}</CardTitle>
              </CardHeader>
              <CardContent>
                <RankedBarChart
                  titulo=""
                  datos={rankingPreguntas[pregunta.id]
                    .slice(0, 3)
                    .map((d) => ({ etiqueta: d.opcion, conteo: d.conteo, porcentaje: d.porcentaje }))}
                  alturaFila={38}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Hallazgos automáticos */}
      <div className="grid gap-3 md:grid-cols-2">
        <InsightCard>
          <strong>{formatPorcentaje(opcionTop1.porcentaje)}</strong> de los participantes considera que un Plan
          Estratégico debe definir principalmente &ldquo;{opcionTop1.opcion.toLowerCase()}&rdquo; — es la opción más
          respaldada entre las 4 preguntas de la encuesta.
        </InsightCard>
        <InsightCard>
          <strong>{formatPorcentaje(porcentajeMultiRol)}</strong> de los participantes tiene más de un rol en la
          universidad. El rol <strong>Graduado</strong> es el que más se combina con otros — muchos egresados
          también son hoy administrativos o gestores del conocimiento.
        </InsightCard>
      </div>

      {/* CTAs */}
      <div className="grid gap-3 sm:grid-cols-2">
        <Link
          href="/participacion"
          className="group flex items-center justify-between rounded-lg border border-border bg-card px-5 py-4 text-sm font-medium transition-colors hover:border-primary/40 hover:bg-secondary/60"
        >
          Explorar quién participó
          <ArrowRight className="size-4 text-primary transition-transform group-hover:translate-x-0.5" />
        </Link>
        <Link
          href="/vision-estrategica"
          className="group flex items-center justify-between rounded-lg border border-border bg-card px-5 py-4 text-sm font-medium transition-colors hover:border-primary/40 hover:bg-secondary/60"
        >
          Ver visión estratégica completa
          <ArrowRight className="size-4 text-primary transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </div>
  );
}
