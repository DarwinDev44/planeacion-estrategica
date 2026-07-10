# Fase 1 — Análisis Funcional

Proyecto: Portal Web Interactivo de Visualización Estratégica Institucional — "Participación, tu voz es fundamental"
Universidad de Cundinamarca

## 1. Fuentes analizadas

| Fuente | Estado | Notas |
|---|---|---|
| `Participación tu voz es fundamental.xlsx` | ✅ Analizado completo | 10.448 filas × 53 columnas, hoja única `Hoja1` |
| `IDXROLES.xlsx` | ✅ Analizado completo | 11.228 filas × 3 columnas, tabla de hechos normalizada rol↔persona |
| `Manual de Imagen Institucional.pdf` (ECOM002V_18) | ✅ Analizado completo | 84 páginas, incluye sección específica "Sistema de Diseño — Lineamientos y Componentes" para el nuevo portal web |
| Logos institucionales (`Logos institucionales/escudos-3/`) | ✅ Inventariado | Escudo y Imagotipo, horizontal/vertical, color/blanco/negro, PNG + AI |
| 3 imágenes sueltas (`imagen.png`, `imagen (1).png`, `imagen (2).png`) | ✅ Revisadas | Piezas de campaña (fondos con textura de hojas, collage promocional), **no** son capturas de Power BI |
| Archivo Power BI (`.pbix`) | ❌ No existe en la carpeta | Se procede sin él, por decisión del usuario. No hay referencia funcional del dashboard actual más allá de lo que ya se documenta aquí |

## 2. Modelo de datos

### 2.1 Naturaleza del dataset

Es una **encuesta de participación institucional** para la construcción del Plan Estratégico de la Universidad de Cundinamarca. 10.448 personas respondieron entre las fechas codificadas como número de serie de Excel (rango ~46093–46176, es decir, alrededor de julio de 2026).

### 2.2 Identificación y consentimiento

- `ID`: identificador único por respuesta (10.448 valores únicos).
- `Hora de inicio` / `Hora de finalización`: timestamps en formato de número de serie Excel — requieren conversión a fecha real en el ETL.
- `Hora de la última modificación`: 100% nula, columna descartable.
- `¿Acepta este aviso de privacidad?`: 100% "SI" — no aporta como filtro, se documenta pero no se visualiza.

### 2.3 Segmentación de audiencia — modelo multi-rol

Este es el hallazgo estructural más importante: **una persona puede tener más de un rol simultáneamente** (p. ej., ser Graduado y también Administrativo).

- `CANTIDAD ROLES`: 1 (9.697 personas) · 2 (722) · 3 (29).
- 5 columnas booleanas independientes: `ES GRADUADO`, `ES ADMIN`, `ES GCA`, `ES ESTUDIANTE`, `ES OPS-APA` (no son mutuamente excluyentes).
- `IDXROLES.xlsx` es la **tabla de hechos ya normalizada** (una fila por cada combinación persona-rol): Estudiante 8.000 · Graduado 1.538 · Gestor del Conocimiento y el Aprendizaje (GCA) 834 · Administrativo 664 · Ops-Apa 192. Total 11.228 asignaciones, cruza exactamente con `CANTIDAD ROLES` del archivo principal (9.697×1 + 722×2 + 29×3 = 11.228). **Esta tabla debe ser la fuente de verdad para cualquier análisis por rol**, no las columnas booleanas del archivo principal (evita doble conteo o subconteo).
- `Rol principal` (5 categorías, mutuamente excluyente, para segmentación simple): Estudiante 7.954 · GCA 834 · Graduado 804 · Administrativo 664 · Ops-Apa 192.
- `Tipo de participante` es una **taxonomía distinta y no equivalente** a `Rol principal` (p. ej. "Creador de Oportunidades" 7.545 vs. "Estudiante" 7.954) — usar con cautela, documentar cuál taxonomía se usa en cada visualización.

### 2.4 Estructura geográfica y académica (repetida por rol)

Debido al modelo multi-rol, las columnas de Sede/Facultad/Programa se **repiten hasta 4 veces** (bloques en columnas 13–44), una por cada rol que la persona tiene:

- Bloque 1 (cols. 13–22): Sede, Facultad, Programa (hasta 8 programas por diseño de formulario de Excel/Forms).
- Bloque 2 (cols. 23–32), Bloque 3 (cols. 33–42): mismo patrón, para 2º y 3er rol.
- Bloque 4 (cols. 43–44): Sede + "Área a que pertenece" (66 valores — dependencias administrativas, para roles Admin/Ops-Apa que no tienen Facultad/Programa académico).
- 7 sedes reales + "Bogotá" (3 casos, probablemente sede de nivel central): Fusagasugá, Facatativá, Chía, Soacha, Ubaté, Girardot, Zipaquirá.
- 157 programas académicos distintos, agrupados en 8 facultades (Ingeniería, Ciencias administrativas y contables, Ciencias agropecuarias, Ciencias del deporte y la educación física, Ciencias de la salud, Ciencias sociales/humanidades/políticas, Instituto de posgrados, Educación).
- **Implicación de arquitectura de datos**: para el ETL, estos 4 bloques deben normalizarse (unpivot) a una tabla larga `persona_id × rol × sede × facultad × programa`, en vez de tratarse como columnas fijas. Esto simplifica enormemente los filtros cruzados del dashboard.

### 2.5 Las 4 preguntas estratégicas (núcleo analítico del portal)

**Hallazgo clave**: estas 4 preguntas **no son texto libre abierto** — son de **selección múltiple (checkboxes)** cuyas opciones vienen concatenadas con `;` en una sola celda. Ya se extrajeron y verificaron las opciones atómicas reales:

**P1 — "Un Plan Estratégico Universitario debe definir principalmente:"** (6 opciones, multi-selección)
| Opción | % de menciones (sobre 10.448) |
|---|---|
| La visión y el rumbo institucional a largo plazo | 55,4% |
| La relación con el entorno (territorio, estado, sector productivo, sociedad y en red con el mundo) | 32,8% |
| Las prioridades estratégicas y grandes decisiones | 29,4% |
| La transformación académica y tecnológica | 23,2% |
| Los indicadores y metas institucionales | 16,7% |
| Los recursos y la sostenibilidad financiera | 13,0% |

**P2 — "¿Cómo consideras que debe construirse y desarrollarse la planeación institucional?"** (5 opciones)
| Opción | % |
|---|---|
| Primero el Plan Estratégico, luego el Plan de Desarrollo y finalmente los Planes de Acción | 62,5% |
| Debe construirse de manera colaborativa y cocreativa con todas las partes interesadas | 47,1% |
| Debe revisarse y ajustarse periódicamente según los cambios del entorno | 24,2% |
| Debe partir de grandes decisiones institucionales y luego traducirse en proyectos concretos | 21,4% |
| No tengo claridad sobre cómo funciona este proceso | 5,3% |

**P3 — "Pensando en el futuro, ¿cuáles decisiones estratégicas consideras debemos abordar?"** (6 opciones cerradas + campo abierto "Otro, ¿cuál?" usado por ~85 personas)
| Opción | % |
|---|---|
| Transformación digital y tecnologías emergentes | 47,7% |
| Acreditación de alta calidad como aprendizaje institucional | 35,2% |
| Persona transhumana frente al avance de la inteligencia artificial | 29,7% |
| Relación con la sociedad, el Estado, el sector productivo y en red con el mundo | 24,8% |
| Sostenibilidad financiera de la universidad pública | 20,5% |
| Formación para la vida, los valores democráticos, la civilidad y la libertad | 15,5% |

**P4 — "En 10 años, ¿cómo te imaginas la UCundinamarca como universidad transmoderna y translocal?"** (5 opciones cerradas + ~60 respuestas abiertas "Otro")
| Opción | % |
|---|---|
| Universidad referente en transformación digital y tecnologías emergentes | 42,5% |
| Universidad que posiciona el pensamiento analítico, la persona transhumana y la vida sostenible | 37,5% |
| Universidad con fuerte impacto territorial y proyección translocal | 34,4% |
| Universidad pública sostenible, autónoma y sólida | 32,6% |
| Universidad que fortalece la formación para la vida, valores democráticos, civilidad y libertad | 22,9% |

**Implicación de diseño**: la visualización principal de estas 4 preguntas debe ser un **ranking de barras horizontales con % de selección** (no nube de palabras ni NLP), segmentable por rol/sede/facultad/programa vía cross-filtering. Las respuestas "Otro" (texto libre genuino, ~150 en total entre P3 y P4) se muestran aparte como panel de hallazgos cualitativos filtrable/buscable — evita el uso de infografías no aptas para texto alternativo, tal como exige el manual (ver §3.4).

## 3. Identidad visual institucional (Manual ECOM002V_18)

### 3.1 Paleta de color — oficial, no se inventan colores nuevos

**Principal** (uso predominante en plataformas digitales institucionales, según el propio manual, pág. 38):
| Nombre | PANTONE | HEX | RGB | CMYK |
|---|---|---|---|---|
| Amarillo | 107 C | `#FBE122` | 251 225 34 | 5 6 89 0 |
| Dorado | 110 C | `#DAAA00` | 218 170 0 | 2 22 100 8 |
| **Verde institucional** | 3536 C | `#007B3E` | 0 123 62 | 100 3 85 10 |
| Verde oscuro | 3537 C | `#00482B` | 0 72 43 | 100 14 99 65 |

**Secundaria** (campañas específicas, piezas menos formales, redes de sedes/facultades):
| Nombre | PANTONE | HEX | RGB | CMYK |
|---|---|---|---|---|
| Naranja | 144 C | `#F7931E` | 247 147 30 | 0 50 91 0 |
| Verde lima | 3561 C | `#79C000` | 121 192 0 | 50 0 98 0 |
| Verde claro | 367 C | `#91C256` | 145 194 86 | 51 0 80 0 |
| Turquesa | 7716 C | `#00A99D` | 0 152 140 | 81 16 51 2 |
| Gris | 425 C | `#4D4D4D` | 77 77 77 | 62 52 50 48 |

**Color oficial por sede** (manual, pág. 39 — clave para segmentar por Unidad Regional con identidad propia):
| Sede | HEX |
|---|---|
| Oficial (genérico/UI) | `#4D4D4D` |
| Girardot | `#DAAA00` |
| Zipaquirá | `#F7931E` |
| Soacha | `#91C256` |
| Chía | `#79C000` |
| Facatativá | `#007B3E` |
| Ubaté | `#00482B` |
| Fusagasugá | `#00A99D` |

Esta tabla coincide 1:1 con las 7 sedes reales del dataset — se usará como paleta categórica oficial en cualquier gráfico desagregado por `Unidad Regional`/`Sede`.

**Degradados oficiales**: `#007B3E → #00A99D → #79C000`, `#79C000 → #007B3E → #00482B`, `#00A99D → #FBE122 → #DAAA00`, `#00482B → #DAAA00 → #F7931E`.

**Sección "Sistema de Diseño — Lineamientos y Componentes" (pág. 59, dirigida explícitamente al nuevo portal web)**: define una paleta *estructurada por roles* (primary / primary-light / primary-dark / dark / white / escala de grises 10–90 / estados éxito-error-advertencia-información) pero sin códigos HEX impresos — es una plantilla de referencia. **Decisión de diseño (Fase 3/5)**: estos roles se mapearán a los HEX oficiales ya certificados arriba, evitando inventar colores nuevos:
- `primary` = `#007B3E` · `primary-light` = `#79C000` · `primary-dark` = `#00482B`
- `warning` = `#F7931E` (ya es el naranja secundario oficial) · `success` = `#00A99D` (ya es el turquesa secundario oficial)
- `info` y `error` no tienen equivalente institucional (esperable — ninguna paleta de marca universitaria define rojo/azul de sistema); se elegirán tonos accesibles neutros que no compitan visualmente con la marca, documentados explícitamente como "colores funcionales de UI, no de marca" en el Design System (Fase 5).
- Escala de grises: se construye una rampa neutra ligada al gris oficial `#4D4D4D` (PANTONE 425 C) como ancla.

### 3.2 Tipografía

Tres familias oficiales: **Century Gothic**, **Times New Roman**, **Montserrat**. Para el portal web se usará **Montserrat** (geométrica, gratuita vía Google Fonts, look/feel equivalente a Century Gothic y con excelente soporte de pesos variables) como tipografía principal de interfaz; Times New Roman queda reservado a contextos impresos/documentales, fuera de alcance del portal.

Jerarquía definida explícitamente para web (pág. 59): H1/H2/H3, texto base, etiquetas/metadata — con variantes móviles propias (Headline Mobile H1/H2, etc.), consistencia de tamaño/peso/interlineado en todos los módulos.

### 3.3 Sistema de grilla y espaciado (definido explícitamente para el portal web, pág. 59)

- Unidad base: **8px**.
- Escala de espaciado: 8, 16, 24, 32, 48, 64 px.
- Grid responsivo: **12 columnas** (desktop) / **8 columnas** (tablet) / **4 columnas** (mobile).

### 3.4 Restricciones de accesibilidad y UX obligatorias (manual, "Otras directrices web", pág. 62-63)

- **Prohibido el uso de ventanas emergentes (popups/modales bloqueantes)** — motivo: barrera de accesibilidad para lectores de pantalla. Implicación directa: no se usarán `Dialog`/modal overlay para flujos críticos; se preferirán paneles laterales no bloqueantes (drawers), expansión inline o rutas dedicadas. Toasts no bloqueantes sí están permitidos (no son "ventana emergente" en el sentido de bloquear la lectura).
- Contraste mínimo 3:1 exigido por el manual — se aplicará el estándar más estricto **WCAG 2.2 AA (4.5:1 texto normal, 3:1 texto grande/UI)** ya comprometido en el brief del proyecto.
- Idioma base: **español latinoamericano** (es-CO), por compatibilidad con lectores de pantalla.
- Todo recurso gráfico requiere texto alternativo; se restringe el uso de infografías no adaptables a alt-text — refuerza la decisión de §2.5 de usar gráficos de datos estructurados (barras, rankings) en vez de imágenes/infografías estáticas.
- Un único sistema de iconos, consistente y funcional (no decorativo) — se usará **Lucide React** como librería única (ya está en el stack), reservando React Icons solo para iconografía de marca/redes sociales que Lucide no cubra.
- Biblioteca de componentes ya delineada por el manual (pág. 61): botones, campos de formulario, navegación (header/menú/breadcrumbs), tabs/filtros, tarjetas, módulos de noticias/bloques informativos, carruseles, buscador principal — se tomará como base y se ampliará con los componentes específicos de BI (KPI cards, gráficos, tablas dinámicas) requeridos por el brief.

### 3.5 Logo / escudo

- Proporción del escudo: relación 2x : 3x (x = diámetro del círculo central). No debe distorsionarse ni reordenarse.
- Área de seguridad: mínimo **X/4** (un cuarto de la altura del escudo) libre alrededor del lockup escudo + wordmark "Universidad de Cundinamarca".
- Activos disponibles ya en el repo: escudo (color/blanco/negro), imagotipo horizontal y vertical (color/blanco/negro), en PNG y vector `.ai`, más versiones PNG 480px.

## 4. Vacíos y supuestos declarados

1. **No existe archivo `.pbix`** en la carpeta — se procede sin referencia funcional del Power BI anterior, por decisión explícita del usuario. Si aparece más adelante, se revisará como insumo adicional sin bloquear el trabajo ya avanzado.
2. Los colores `info`/`error` del sistema de UI no están definidos por el manual de marca (es normal — ninguna universidad define rojo/azul de sistema) y se documentarán como colores funcionales, no de identidad, en el Design System.
3. `Bogotá` aparece con apenas 3 casos en `Unidad Regional` — se tratará como categoría válida pero de bajo volumen (posible sede central/nivel directivo), no se descarta como error de datos sin confirmación.
4. Las columnas de timestamp (`Hora de inicio`, `Hora de finalización`) están en formato numérico serial de Excel — se convertirán a fecha/hora real en el ETL para habilitar análisis de evolución temporal de la participación.
