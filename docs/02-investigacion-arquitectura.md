# Fase 2 + 3 — Investigación y Arquitectura

(Fases combinadas a solicitud del usuario, priorizando velocidad hacia Arquitectura y Diseño UI)

---

## FASE 2 — INVESTIGACIÓN

### 2.1 Dimensiones identificadas

| Dimensión | Cardinalidad | Jerarquía | Fuente |
|---|---|---|---|
| **Rol** | 5 valores | `Tipo de participante` (4) ⟂ `Rol principal` (5, excluyente) ⟂ `Rol` normalizado en IDXROLES (multi-valor real) | Cols. 6-7 + IDXROLES.xlsx |
| **Ubicación académica** | 7 sedes | Sede → Facultad (8) → Programa (157) | Cols. 13-15, 23-25, 33-35 (repetidas por rol) |
| **Ubicación administrativa** | 7 sedes + "Oficial" | Sede → Área (66) | Cols. 43-44 |
| **Tiempo** | 91 días con actividad (24 feb – 24 jun 2026) | Día → Semana → Ola de campaña | Col. 2 (Hora de inicio) |
| **Pregunta estratégica** | 4 preguntas | Pregunta → Opción atómica (6, 5, 6, 5 respectivamente) | Cols. 45-48 |

**Relación central del modelo**: `Persona (1) — (N) Rol` es la relación no trivial. Todo lo demás (sede, facultad, programa, área) cuelga *del rol*, no de la persona directamente — una persona con 2 roles puede pertenecer a 2 sedes distintas. El modelo dimensional correcto es:

```
persona_respuesta (grano: 1 fila = 1 persona = 1 encuesta)
  └─ rol_asignado (grano: 1 fila = 1 persona × 1 rol)   ← IDXROLES, ya normalizado
       └─ ubicacion (sede, facultad/área, programa)      ← depende del rol, no de la persona
  └─ respuesta_pregunta (grano: 1 fila = 1 persona × 1 pregunta × 1 opción marcada)  ← requiere unpivot de P1-P4
```

### 2.2 KPIs del dashboard ejecutivo

| KPI | Cálculo | Nota |
|---|---|---|
| Total de participantes | `COUNT(DISTINCT ID)` = 10.448 | — |
| Total de asignaciones de rol | `COUNT(*)` en IDXROLES = 11.228 | Para explicar por qué "roles" suma más que "personas" |
| Cobertura geográfica | 8/8 sedes con participación (7 sedes regionales + Bogotá, nivel central) | Ninguna sede en cero |
| Cobertura académica | 157 programas, 8 facultades | — |
| Personas con más de un rol | 751 (296+257+101+51+27+15+2+2) | Insight destacable: ~7,2% de participantes tienen rol múltiple |
| Tema más respaldado (P1) | "Visión y rumbo institucional a largo plazo" — 55,4% | Headline del hallazgo ejecutivo |
| Ola de mayor participación | 25 mar 2026 — 2.011 respuestas en un solo día | — |
| Duración de la campaña | 24 feb – 24 jun 2026 (121 días calendario, 91 con actividad) | — |

**Vacío declarado**: no existe en los archivos entregados un "universo poblacional" (total de estudiantes/graduados/administrativos matriculados o vinculados) por sede/rol. Sin ese dato **no se puede calcular una verdadera tasa de participación (%)**, solo conteos absolutos. Se documenta como *oportunidad de mejora* — si se consigue esa tabla más adelante, el KPI "Total de participantes" se convierte en "Tasa de participación" con mucho más impacto ejecutivo. Mientras tanto, el dashboard mostrará conteos absolutos y distribución relativa (% dentro del total de respondientes), no tasas de cobertura poblacional.

### 2.3 Hallazgos de investigación relevantes para el storytelling

1. **Combinaciones de multi-rol** (751 personas, 7,2% del total):
   - Administrativo + Graduado: 296
   - GCA + Graduado: 257
   - Estudiante + Graduado: 101
   - Graduado + Ops-Apa: 51
   - Administrativo + Estudiante + Graduado: 27
   - Administrativo + Estudiante: 15
   - Estudiante + GCA (+Graduado): 4
   → El rol "Graduado" es el gran conector: aparece en casi todas las combinaciones. Esto sugiere que muchos empleados/administrativos de la universidad son también egresados — un hallazgo genuino con valor narrativo para el dashboard ("la comunidad Ucundinamarca se forma a sí misma").

2. **Olas de participación** claramente delimitadas, no una curva continua: picos abruptos en 12, 17, 24-27 mar; 6 y 20 abr; 20, 22, 25-29 may; 3-5 y 12-13 jun. Esto indica jornadas de recolección dirigidas (probablemente por sede o por rol). El gráfico de evolución temporal debe usarse para contar esa historia de "olas de convocatoria", no solo como decoración.

3. **Coherencia narrativa P3↔P4**: quienes priorizan "Transformación digital y tecnologías emergentes" en P3 (decisiones a futuro) son coherentes con quienes eligen "Universidad referente en transformación digital" en P4 (visión a 10 años) — ambas son la opción #1 en sus respectivas preguntas. Vale la pena una vista de cruce dedicada en el dashboard de "Visión Estratégica".

### 2.4 Oportunidades de mejora frente al Power BI anterior (sin `.pbix` de referencia, basado en el brief y en las limitaciones típicas de Power BI Service)

- Cross-filtering fluido entre las 4 preguntas y las dimensiones demográficas, con URL state (filtros compartibles por link) — Power BI Service no permite esto de forma nativa sin Power BI Embedded.
- Panel dedicado y buscable para las ~150 respuestas "Otro" (texto libre real) — en Power BI esto normalmente se omite o se entierra en una tabla.
- Identidad de marca 100% institucional (colores por sede, tipografía, sin la estética genérica de Power BI).
- Rendimiento: datos pre-agregados en build-time en vez de recalcular sobre 10K filas en cada interacción.
- Accesibilidad real (WCAG 2.2 AA, sin ventanas emergentes) — Power BI Service tiene soporte de accesibilidad limitado.
- Mobile-first genuino (Power BI Service es notoriamente pobre en móvil).

---

## FASE 3 — ARQUITECTURA

### 3.0 Desviación de stack registrada

**Tremor** (listado en el stack original) fue retirado: la versión publicada (`@tremor/react` 3.18.7) exige React `^18`, incompatible con **React 19** — requisito explícito y no negociable del stack. Se reemplazó por **Recharts 3 + los primitivos `chart.tsx` de shadcn/ui**, que sí soportan React 19 y permiten aplicar directamente la paleta institucional validada (ver `03-design-system-dashboards.md`) sin pelear contra el sistema de theming propio de Tremor. Ninguna otra pieza del stack requerido cambió.

### 3.1 Estrategia de datos

El dataset es un **snapshot cerrado** (encuesta finalizada el 24 jun 2026), no un sistema transaccional en vivo. Se opta por una arquitectura de **datos estáticos pre-agregados en build-time**, sin base de datos:

```
Excel (.xlsx)  →  script ETL (Node, en /scripts)  →  JSON normalizado y agregados pre-calculados (/data)  →  Server Components leen /data en build/request time
```

- `scripts/etl.ts`: lee los 2 `.xlsx`, hace el *unpivot* de los 4 bloques Sede/Facultad/Programa y de las 4 preguntas multi-selección, normaliza fechas, y escribe JSON tipado en `data/`.
- Los Server Components consultan los JSON vía la capa `repositories/` — **nunca** el cliente descarga las 10.448 filas crudas; cada vista pide solo el agregado que necesita.
- Filtros interactivos (rol, sede, facultad, programa, rango de fecha) se resuelven mediante **Route Handlers** (`app/api/.../route.ts`) que agregan sobre los JSON en el servidor y devuelven solo el resultado agregado — así el cross-filtering no mueve datos crudos al navegador.
- Diseño pensado para escalar: si en el futuro los datos migran a una base de datos real (nuevas encuestas, actualización periódica), solo cambia la implementación interna de `repositories/`, no los componentes ni los hooks que los consumen (Dependency Inversion).

### 3.2 Estructura de carpetas

```
app/
  (dashboard)/
    layout.tsx              # Sidebar + Navbar + Breadcrumbs
    page.tsx                # Dashboard ejecutivo (home)
    participacion/page.tsx  # Quién participó (rol, sede, facultad, programa)
    vision-estrategica/page.tsx  # Las 4 preguntas + cruce + panel "Otro"
    exploracion/page.tsx    # Tabla dinámica / drill-down libre + export
  api/
    filtros/route.ts        # Agregaciones bajo demanda según filtros activos
  layout.tsx                 # Root layout, fuentes, metadata, providers
components/
  ui/                        # Primitivos shadcn (Button, Select, Tabs, Drawer, Toast...)
  charts/                    # Wrappers Recharts/Tremor con tema institucional aplicado
  kpi/                       # KPICard, MetricCard
  layout/                    # Sidebar, Navbar, Breadcrumbs, FilterBar
modules/
  participacion/             # lógica + componentes específicos del dominio "quién participó"
  vision-estrategica/        # lógica + componentes específicos de las 4 preguntas
  exploracion/
hooks/                       # useFiltrosGlobales, useAgregado, etc.
services/                    # llamadas a /api desde el cliente (React Query)
repositories/                # acceso a los JSON pre-agregados (server-only)
lib/                         # utilidades transversales (formatters, colores por sede, etc.)
store/                       # Zustand: filtros globales compartidos entre dashboards
types/                       # Persona, RolAsignado, RespuestaPregunta, OpcionPregunta, Sede...
constants/                   # paleta de marca, mapeos sede→color, textos es-CO
styles/                      # tokens CSS, Tailwind config
scripts/etl.ts                # ETL de los .xlsx → data/*.json
data/                         # salida del ETL (JSON versionado, no editado a mano)
public/assets/                # logos oficiales, texturas del manual
```

### 3.3 Gestión de estado

- **Zustand** (`store/filtros.ts`): estado global de filtros activos (rol, sede, facultad, programa, rango de fecha) — compartido entre todos los dashboards para permitir cross-filtering consistente, sincronizado con la URL (`nuqs` o `useSearchParams`) para que los filtros sean parte del historial de navegación y compartibles por link.
- **TanStack Query**: para las llamadas a `app/api/filtros` desde componentes cliente que necesitan re-agregar al cambiar filtros, con caché para evitar recomputar la misma combinación dos veces.
- Server Components para la carga inicial (sin JS de más), Client Components solo donde hay interacción real (charts, filtros, tabla).

### 3.4 Tipado central (fragmento orientativo)

```ts
type Rol = "Estudiante" | "Graduado" | "Gestores del Conocimiento y el Aprendizaje" | "Administrativo" | "Ops-Apa"
type Sede = "Fusagasugá" | "Facatativá" | "Chía" | "Soacha" | "Ubaté" | "Girardot" | "Zipaquirá" | "Bogotá"

interface RolAsignado {
  personaId: number
  rol: Rol
  sede?: Sede
  facultad?: string
  programa?: string
  area?: string           // solo para roles administrativos
}

interface RespuestaPregunta {
  personaId: number
  preguntaId: "P1" | "P2" | "P3" | "P4"
  opcion: string           // opción atómica ya separada del ";"
  esOtro: boolean          // true si es texto libre fuera de las opciones cerradas
}
```

### 3.5 Patrón repositorio

`repositories/encuestaRepository.ts` expone funciones puras (`getKpisEjecutivos()`, `getDistribucionPorRol()`, `getRankingPregunta(preguntaId, filtros)`, `getSeriesTiempo()`...) que hoy leen de `data/*.json` y mañana podrían leer de una base de datos, sin que ningún componente o hook cliente necesite cambiar.
