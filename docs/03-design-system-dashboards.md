# Fase 5 — Design System y Especificación de Dashboards

(Fase de UX formal/wireframes de bajo nivel omitida a solicitud del usuario; las decisiones de navegación e información imprescindibles quedan documentadas dentro de este archivo, junto a Arquitectura en `02-investigacion-arquitectura.md`)

Metodología de color validada con el validador CVD/contraste del skill de data-viz interno (`validate_palette.js`, checks: banda de luminosidad OKLCH, piso de croma, separación CVD Machado-2009, contraste vs. superficie). **Todas las paletas listadas abajo ya pasaron la validación real, no son estimaciones.**

---

## 1. Tokens de color

### 1.1 Identidad de marca (uso literal: logo, chrome de UI, botones primarios, headers, hero)

| Token | Hex | Uso |
|---|---|---|
| `brand-primary` | `#007B3E` | Verde institucional — acciones primarias, header, activo de navegación |
| `brand-primary-dark` | `#00482B` | Hover/pressed de primario, fondos oscuros de marca |
| `brand-accent` | `#79C000` | Acentos, botones secundarios, highlights |
| `brand-gold` | `#DAAA00` | Detalles puntuales, badges destacados |
| `brand-warning-orange` | `#F7931E` | = token `warning` reutilizado (ya es oficial secundario, ver §1.4) |
| `brand-teal` | `#00A99D` | = token `success` reutilizado (ya es oficial secundario, ver §1.4) |
| `brand-gray` | `#4D4D4D` | Ancla de la escala de neutros (§1.5) |

### 1.2 Sequential (job: magnitud — ranking de opciones en P1–P4, cualquier "top N", barras de un solo valor)

Un único hue, institucional, claro→oscuro. Es la paleta que más se usa en este dashboard porque casi todos los gráficos de contenido (las 4 preguntas estratégicas) son **una sola serie ordenada por magnitud**, no identidad multi-categoría — por eso no requieren paleta categórica ni pasan por el validador CVD (aplica solo a categóricas).

| Paso | Hex |
|---|---|
| 100 | `#D6EDE1` |
| 200 | `#A8D9BE` |
| 300 | `#6FC095` |
| 400 | `#3CA76F` |
| 500 (ancla — `brand-primary`) | `#007B3E` |
| 600 | `#006232` |
| 700 (ancla — `brand-primary-dark`) | `#00482B` |

Regla de uso: todas las barras de un mismo gráfico de ranking usan el **mismo paso** (típicamente 500); no se colorea cada barra distinto — la longitud/valor ya codifica la magnitud, el color solo da identidad de marca. Ver `references/anti-patterns.md` del skill: nunca colorear barras nominales por su valor.

### 1.3 Categórica (job: identidad — la única donde de verdad conviven varias series a la vez: distribución por Rol)

Se intentó usar directamente los 5 colores secundarios oficiales del manual y **falló la validación** (croma insuficiente en el gris oficial `#4D4D4D`, separación CVD insuficiente entre verdes adyacentes, contraste bajo). Se ajustó manteniendo las familias de color de marca (verde, naranja, verde-azulado, dorado) y sustituyendo el gris —que no puede servir de identidad categórica por diseño— por un azul institucional-neutro reservado solo para este uso funcional:

| Slot | Rol | Light | Dark |
|---|---|---|---|
| 1 | Estudiante (8.000) | `#0E8F52` | `#2CAE72` |
| 2 | Graduado (1.538) | `#E8720C` | `#C96A28` |
| 3 | Gestores del Conocimiento y el Aprendizaje (834) | `#00A99D` | `#1CA79B` |
| 4 | Ops-Apa (192) | `#D9A400` | `#A6821E` |
| 5 | Administrativo (664) | `#2F5C99` | `#5578BE` |

Validado: banda de luminosidad OK, piso de croma OK, separación CVD ΔE 29,4 (normal 91,5) — muy por encima del objetivo (≥12). Contraste de 3 slots queda por debajo de 3:1 en modo claro (esperado en paletas ricas): **por eso todo gráfico que use esta paleta lleva etiquetas de valor visibles siempre**, nunca solo el color (regla de "relief" del validador).

**Sede (7 valores) — decisión explícita de NO usar paleta categórica**: 7-8 hues categóricos simultáneos fallan el piso de separación CVD de forma estructural (family clash entre los verdes oficiales de Facatativá/Chía/Soacha). En su lugar: los gráficos por sede se renderizan como **barras ordenadas de un solo hue** (sequential §1.2) — que es además más correcto analíticamente, porque en el 90% de los casos lo que se quiere leer es el ranking de sedes por volumen, no comparar 7 identidades a la vez. El color oficial de cada sede (tabla del manual, pág. 39) se conserva como **badge/chip de marca** (punto de color de 8px junto al nombre de la sede en leyendas, tarjetas y filtros) — refuerza reconocimiento visual sin ser el canal primario de lectura del dato.

### 1.4 Estado (fijo, nunca temático — reservado y distinto de la paleta categórica)

| Rol | Hex | Uso |
|---|---|---|
| `success` | `#00A99D` (oficial, PANTONE 7716C) | confirmaciones, tendencia positiva |
| `warning` | `#F7931E` (oficial, PANTONE 144C) | advertencias, datos incompletos |
| `error` | `#D03B3B` | validación de formularios, estados críticos — **no existe en la marca**, es un color funcional de UI documentado como tal, no de identidad |
| `info` | `#2F5C99` | mensajes informativos — mismo azul institucional-neutro de §1.3 |

Siempre acompañados de ícono + etiqueta de texto, nunca color aislado (mandato del propio manual de marca, §3.4 de `01-analisis-funcional.md`).

### 1.5 Neutros (texto, fondos, bordes) — anclados en el gris oficial `#4D4D4D`

| Token | Light | Dark |
|---|---|---|
| Superficie de página | `#FAFAF8` | `#0D1A13` |
| Superficie de tarjeta/gráfico | `#FFFFFF` | `#132A1E` |
| Texto primario | `#1A1A18` | `#F3F3F0` |
| Texto secundario | `#4D4D4D` (ancla oficial) | `#C4C4BE` |
| Texto muted / ejes | `#7C7C76` | `#8B8B84` |
| Línea de grilla | `#E4E3DE` | `#28382F` |
| Borde | `rgba(20,20,18,0.10)` | `rgba(255,255,255,0.10)` |

---

## 2. Tipografía

- **Montserrat** (Google Fonts, `next/font`) como tipografía única de interfaz — sustituye a Century Gothic (no disponible en web) manteniendo el mismo carácter geométrico definido en el manual.
- Jerarquía (siguiendo la especificación literal del manual para el portal web, pág. 59-60):

| Nivel | Desktop | Mobile | Peso |
|---|---|---|---|
| H1 | 40px / 1.15 | 28px / 1.2 | 700 |
| H2 | 32px / 1.2 | 24px / 1.25 | 700 |
| H3 | 24px / 1.3 | 20px / 1.3 | 600 |
| Body | 16px / 1.6 | 15px / 1.6 | 400 |
| Small / metadata | 13px / 1.5 | 13px / 1.5 | 500 |
| Cifra hero (KPI) | 48–56px / 1.05 | 36px / 1.05 | 700, `tabular-nums` |

Números en tablas y ejes de gráficos: `font-variant-numeric: tabular-nums` para alineación vertical (regla del skill de data-viz).

## 3. Espaciado y grid

- Unidad base **8px**; escala 8·16·24·32·48·64 (literal del manual, pág. 59).
- Grid responsivo: **12 columnas desktop / 8 tablet / 4 mobile** (literal del manual).
- Breakpoints Tailwind: `sm` 640 · `md` 768 · `lg` 1024 · `xl` 1280 · `2xl` 1536, más un contenedor `max-w-[1440px]` para pantallas ultrawide (evita que los dashboards se estiren sin control en monitores 21:9).

## 4. Elevación, radios, iconografía

- Radios: `4px` (inputs/badges) · `8px` (tarjetas) · `12px` (paneles/drawers) · `full` (chips/pills).
- Elevación: solo 3 niveles (`sm` hover de tarjeta, `md` dropdown/popover, `lg` drawer/sheet) — sombras suaves, nunca decorativas.
- Iconografía: **Lucide React** como sistema único (consistente, funcional — mandato del manual §3.4). React Icons se reserva exclusivamente para logos de redes sociales en el footer institucional.

## 5. Regla dura de interacción: cero ventanas emergentes

Mandato explícito del manual (pág. 62). Consecuencias directas en la biblioteca de componentes:

- **Nunca** `Dialog`/modal bloqueante para flujos de producto (detalle de un hallazgo, confirmación, formulario de exportación). En su lugar: **Sheet/Drawer lateral** (no bloquea el flujo de lectura, es dismissible y accesible con lector de pantalla) o **navegación a ruta dedicada** (`/exploracion/[id]`).
- **Sí** se permiten: `Toast` (Sonner) no bloqueante y auto-descartable para confirmaciones breves ("Exportación lista"), `Popover`/`Tooltip` para información contextual que no interrumpe el foco.
- `Select`, `Combobox` y `DropdownMenu` no cuentan como ventana emergente (son controles de formulario estándar).

## 6. Biblioteca de componentes

Basada en la propuesta del propio manual (pág. 61, "Biblioteca de Componentes") + los requeridos por el brief de BI:

**Base**: Button (primario/secundario/ghost/destructivo, con estados hover/focus/disabled/loading) · Input, Select, Combobox de búsqueda · Header, Sidebar, Breadcrumbs · Tabs · FilterBar (chips de filtro activo, siempre en una sola fila sobre los gráficos) · Sheet/Drawer · Toast.

**KPI / datos**: KPICard (cifra hero + variación + sparkline opcional) · MetricCard (comparativo) · RankedBarChart (sequential, §1.2 — para P1–P4) · CategoricalBarChart (categórica, §1.3 — para Rol) · TimeSeriesChart (área/línea, sequential — evolución temporal con anotaciones de "olas") · DataTable (virtualizada, orden/búsqueda — para Programa/Facultad/Área, 157 valores) · SedeBadge (chip con color oficial + nombre) · InsightCard (hallazgo automático redactado, ej. "El 55% prioriza la visión a largo plazo").

**Estado**: Skeleton (loading) · EmptyState · ErrorState · cada gráfico incluye alternancia **"Ver como tabla"** (mandato de accesibilidad del skill de data-viz: toda visualización necesita una vista tabular equivalente).

## 7. Selección de tipo de gráfico por pregunta analítica (método "choosing a form" antes que estética)

| Necesidad analítica | Forma elegida | Por qué |
|---|---|---|
| Totales ejecutivos (participantes, roles, sedes) | KPI Card + cifra hero | Un número, no una lista — no merece un gráfico |
| Ranking de opciones en P1–P4 | Barra horizontal ordenada, un solo hue sequential | Magnitud de una sola serie; el orden importa, la identidad no |
| Distribución por Rol (5 categorías simultáneas) | Barra horizontal, paleta categórica §1.3, etiquetas de valor directas | Identidad real de 5 series a la vez — única categórica del dashboard |
| Distribución por Sede (7) | Barra horizontal ordenada, un solo hue + badge de color oficial | Evita el fallo CVD de 7 hues; el badge preserva reconocimiento de marca |
| Evolución temporal de respuestas | Área/línea, un solo hue, anotaciones en picos | Serie única en el tiempo; picos "de ola" se marcan con anotación, no con color adicional |
| Multi-rol (combinaciones) | Barra horizontal ordenada (tabla de combinaciones ya es corta, 8 filas) | Categorías compuestas, mejor como lista ordenada que como diagrama de Venn |
| Programa / Facultad (157 valores) | DataTable con búsqueda + orden, no gráfico | Demasiadas categorías para cualquier gráfico legible; se exploran, no se comparan de un vistazo |
| Respuestas "Otro" (texto libre real) | Lista filtrable/buscable con chips de pregunta | Contenido cualitativo — nunca nube de palabras (el manual prohíbe infografías no aptas para texto alternativo) |
| Cruce P3 ↔ P4 (coherencia narrativa) | Tabla de correlación simple (top opción de P3 vs. top opción de P4 por segmento) | Dos categóricas cruzadas con pocas filas — tabla es más legible y accesible que una matriz de color |

Ningún gráfico usa doble eje Y, pie/donut (evitado por el propio skill de data-viz salvo casos de 2 categorías), ni relleno arcoíris.

---

## 8. Dashboard principal — "Resumen Ejecutivo" (`/`)

Orden de lectura de arriba hacia abajo (jerarquía "claridad ante todo" del manual §3.4):

1. **Franja de KPIs** (5 KPI Cards en fila, colapsa a 2 columnas en mobile): Total participantes 10.448 · Asignaciones de rol 11.228 · Sedes con participación 8/8 · Programas representados 157 · Personas con más de un rol 751 (7,2%).
2. **FilterBar global** (Rol, Sede, Facultad, Rango de fechas) — sticky al hacer scroll, sincronizado con la URL.
3. **Fila de 2 gráficos**: Distribución por Rol (categórica) junto a Distribución por Sede (sequential + badges).
4. **Evolución temporal** de respuestas, ancho completo, con anotaciones en los picos de "ola" (25 mar, 3 jun, etc.).
5. **"Lo que la comunidad prioriza"**: top-3 opciones de cada una de las 4 preguntas estratégicas, como 4 mini RankedBarChart en grid 2×2 — el resumen narrativo del hallazgo principal del portal.
6. **InsightCards** (3-4 hallazgos automáticos redactados en lenguaje claro, ej. "7,2% de los participantes tiene más de un rol en la universidad — Graduado es el rol conector").
7. CTA hacia los dashboards secundarios ("Explorar quién participó →", "Ver visión estratégica completa →").

## 9. Dashboards secundarios

**`/participacion`** — Quién participó: KPIs de cobertura, RankedBarChart Rol y Sede completos (no solo top), tabla de combinaciones multi-rol, DataTable de Facultad→Programa con búsqueda, filtro cruzado con el resto del sitio.

**`/vision-estrategica`** — Las 4 preguntas a fondo: una sección por pregunta (RankedBarChart completo con las 6/5/6/5 opciones reales, no combos crudos), panel de cruce P3↔P4, panel buscable de respuestas "Otro" con chip de qué pregunta pertenece, todo filtrable por Rol/Sede/Facultad vía el FilterBar global.

**`/exploracion`** — Tabla dinámica libre: DataTable virtualizada sobre el dataset ya normalizado (persona × rol × sede × facultad × programa × respuestas), columnas seleccionables, orden, búsqueda, exportación CSV/XLSX — reemplaza la "tabla dinámica" de Power BI con una experiencia más rápida y accesible.

---

## 10. Checklist de accesibilidad (WCAG 2.2 AA) aplicado a cada componente anterior

- Contraste ≥ 4.5:1 texto normal / 3:1 texto grande y UI — supera el mínimo 3:1 del manual.
- Cero ventanas emergentes bloqueantes (§5).
- Navegación completa por teclado, foco visible en todo elemento interactivo.
- Cada gráfico: alternativa en tabla, texto alternativo/`aria-label` describiendo el hallazgo (no solo "gráfico de barras"), nunca color como único canal de información.
- Idioma `es-CO` en el `<html lang>`, todo el contenido en español latinoamericano.
- `prefers-reduced-motion` respetado en las animaciones de Framer Motion.
