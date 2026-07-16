# CLAUDE.md — Reglas del proyecto

Estas reglas aplican a todo el proyecto y tienen prioridad sobre cualquier
convención genérica. Léelas antes de tocar código.

El sitio (Next.js) vive en la **raíz del repositorio**: `app/`, `components/`,
`data/`, `repositories/`… cuelgan directamente de aquí, y las rutas de este
documento son relativas a esa raíz. No hay carpeta contenedora intermedia — si
alguna vez se anida el proyecto, hay que actualizar a la vez el *Root Directory*
del proyecto en Vercel y `Compilar-Portable.bat`, que asumen esta estructura
plana.

## 1. Gestor de paquetes: pnpm — obligatorio

Nunca `npm` ni `yarn` ni `bun`, en ningún contexto (instalación, scripts, CI,
`npx`). Siempre `pnpm` / `pnpm add` / `pnpm dlx`. El proyecto fija el gestor en
`package.json` (`packageManager`) y usa `pnpm-workspace.yaml` para
configuración de instalación (incluido `node-linker: hoisted` cuando se genera el
build portable — ver más abajo).

## 2. Arquitectura de datos: el Excel es la única fuente de verdad

- **Todos** los módulos leen su Excel en vivo con `fs` desde
  `data/source-*/`. No hay JSON intermedios ni scripts ETL: editar el
  Excel se refleja en la siguiente petición, sin regenerar nada. No se
  reintroduzca un `data/*.json` con datos de negocio.
- Agregar una fila/persona/actividad nueva debe bastar con editar el Excel (y,
  cuando aplique, soltar un archivo de foto con el slug correcto) — nunca
  hardcodear datos en componentes, constantes o datasources. Si un dato de
  negocio falta en el Excel (un nombre, una regla de exclusión), se agrega al
  Excel — no al código.
- Las rutas de los Excel son **siempre relativas** a la raíz del proyecto
  (`join(process.cwd(), "data", "source-*")`). Nunca una ruta absoluta del
  escritorio: Vercel corre en Linux y el `.exe` portable debe ser autocontenido,
  así que una ruta tipo `C:\Users\...` rompe ambos.
- Todo `data/source-*/` nuevo debe registrarse en `outputFileTracingIncludes`
  (`next.config.ts`) o Vercel no empaqueta los `.xlsx` en el bundle
  serverless.
- Los archivos de trabajo sueltos que alguien deja en el escritorio para
  actualizar un Excel (fuera de este repo) nunca se versionan — solo su copia
  dentro de `data/source-*/` es la fuente real que usa el sitio.

## 2.1 Capas: quién puede llamar a quién

El flujo de datos va **siempre en una dirección** y sin saltarse escalones:

```
  data/source-*/*.xlsx          Fuente de verdad (única)
          ↓
  datasource/infrastructure/    Cómo se lee y se cachea un archivo
          ↓                       · excel.ts        — única puerta a la librería XLSX
          ↓                       · cache-archivo.ts — caché invalidada por mtime
          ↓                       · singleton.ts     — una instancia por proceso
  datasource/excel-*-source.ts  Qué significan las celdas de UN Excel
          ↓                     (implementa un contrato de types.ts)
  repositories/*Repository.ts   Única puerta de entrada a los datos
          ↓
  app/**/page.tsx               Punto de entrada (Server Component)
          ↓
  components/**                 Presentación
```

Reglas que se derivan de lo anterior, y que un cambio nuevo no debe romper:

- **Un componente o página nunca importa un `datasource`** — solo repositorios.
  El único acoplamiento permitido hacia abajo es el repositorio → su datasource.
- **Ningún módulo llama a `XLSX` ni a `readFileSync` por su cuenta**: se pasa por
  `datasource/infrastructure/excel.ts`. Que la lectura esté en un solo sitio es
  lo que garantiza que dos módulos interpreten igual una misma celda.
- **Ningún datasource implementa su propia caché**: usa `CacheArchivo`. Un origen
  sin caché reparsea su Excel en cada request (le pasó a analítica de momentos:
  releía 8 archivos por visita).
- Un datasource se construye **solo** en `datasource/index.ts`, vía
  `crearSingleton`. La instancia guarda la caché: crear una nueva por consulta la
  tiraría.
- Cada origen implementa un **contrato declarado en `datasource/types.ts`**, y el
  repositorio depende del contrato, nunca de la clase. Migrar un módulo a SQL o a
  una API es escribir otra clase que cumpla el contrato y cambiar una línea de
  `index.ts`: ni repositorios, ni páginas, ni componentes se enteran.

### Dónde va cada cosa

| Capa | Carpeta | Responsabilidad |
|---|---|---|
| Infraestructura | `repositories/datasource/infrastructure/` | Leer archivos, cachear, instanciar. Nada de negocio. |
| Origen de datos | `repositories/datasource/excel-*-source.ts` | Interpretar UN Excel y tiparlo. |
| Contratos | `repositories/datasource/types.ts` | Interfaz que cumple cada origen. |
| Repositorio | `repositories/*Repository.ts` | Puerta única de datos; agrega y compone. |
| Reglas de negocio | `lib/reglas/` | Umbrales y criterios que comparten servidor y vista. |
| Tipos de dominio | `types/` | Forma de los datos. Nunca se declaran dentro de un datasource. |
| Utilidades | `lib/` | Funciones puras sin estado (formato, búsqueda, texto). |
| Configuración | `constants/` | Valores fijos que no salen del Excel (navegación, marca). |

### Reglas de negocio compartidas (`lib/reglas/`)

Cuando un umbral o un criterio lo necesitan **el servidor y la vista a la vez**,
vive en `lib/reglas/` — un módulo neutro, sin `server-only` ni `"use client"`,
que ambos importan. Ejemplo real: los rangos de días de accesos y el umbral de
atención (`UMBRAL_ATENCION_DIAS`) estaban duplicados literalmente en el
datasource y en el panel; cambiar el criterio obligaba a editar dos capas y, si
se olvidaba una, el gráfico y las tarjetas mostraban cifras que se
contradecían. Una regla de negocio se define una vez y se importa.

### Rendimiento: cómo conviven "Excel en vivo" y velocidad

`CacheArchivo` guarda en memoria lo ya parseado y lo descarta en cuanto cambia
la fecha de modificación del archivo (y, para orígenes que leen un directorio
completo, cuando aparece o desaparece un `.xlsx`). El resultado: los datos son
siempre los del Excel —editarlo se ve en la siguiente petición, sin reiniciar—
pero en estado estable una página no hace **ninguna** lectura de disco. Al tocar
esta capa, mantener ambas propiedades: si algo se cachea sin invalidar por
`mtime`, se rompe la regla principal del proyecto.

## 3. Sin diseño responsivo para móvil — regla de interfaz

**El sitio debe verse y comportarse exactamente igual en cualquier dispositivo,
incluidos los teléfonos.** No se crean variantes de layout para pantallas
pequeñas.

- Nunca uses breakpoints de Tailwind (`sm:`, `md:`, `lg:`, `xl:`, `2xl:`) para
  cambiar visibilidad, dirección de flex, columnas de grid o tamaños de fuente
  de forma condicional. Usa directamente el valor de escritorio, sin prefijo.
- Motivo técnico: el mecanismo de `app/layout.tsx` (clase `forzar-escritorio` +
  `transform: scale()` sobre `#app-frame`) hace que el sitio se vea como
  escritorio escalado en cualquier pantalla física — pero las media queries de
  Tailwind evalúan siempre contra el viewport real, no contra el tamaño ya
  escalado. Cualquier clase `sm:`/`lg:`/etc. rompe esa ilusión y el componente
  vuelve a comportarse como "modo móvil" real (menús hamburguesa, columnas que
  colapsan, texto más chico), inconsistente con el resto del sitio.
- Excepción explícita y deliberada: `components/ui/input.tsx` y `textarea.tsx`
  usan `md:text-sm` para evitar el zoom automático de Safari al enfocar un
  campo en iOS — es una salvaguarda funcional, no una adaptación de diseño, y
  debe conservarse.
- Cualquier componente o funcionalidad nueva debe respetar el diseño existente
  y verse igual en PC y en móvil, salvo instrucción explícita en contrario.

## 4. Buenas prácticas antes de subir cambios a GitHub

1. `pnpm build` debe pasar limpio (sin `output: "standalone"`, ese modo solo se
   activa con `BUILD_STANDALONE=1` para el `.exe` portable — nunca debe alterar
   el build normal que usa Vercel).
2. Para cualquier cambio visual o interactivo, probar con Playwright en
   **WebKit real** (`playwright.webkit`, no la emulación de dispositivo de
   Chromium) — este proyecto tiene historial de bugs que solo aparecen ahí.
   Cualquier script de verificación temporal (`__*.mjs`) se borra antes de
   terminar; nunca se commitea.
3. Nunca `git add -A` ni `git add .` — añadir archivos explícitos por nombre,
   revisando `git status`/`git diff` antes de comitear.
4. Nunca usar `--no-verify`, `--no-gpg-sign`, ni saltarse hooks.
5. Nunca forzar push (`--force`) a `main` sin autorización explícita.
6. Después de un push a `main`, confirmar el deployment en Vercel (vía el API
   de estado de commits de GitHub) antes de dar el cambio por terminado.
7. No dejar archivos de prueba, backups temporales (`*.backup-*.xlsx`) ni
   carpetas de build (`portal-build-portable/`, `portal-portable/`) sueltos en
   el repo — ver `.gitignore`.

## 5. Autoría

- Los commits usan el usuario y correo configurados en este repositorio
  (`git config user.name` / `user.email`) — nunca otra identidad.
- **No incluir referencias, comentarios, metadatos ni créditos relacionados con
  Claude, Anthropic, GitHub Copilot ni ninguna otra herramienta de IA** en
  mensajes de commit, código, comentarios, `package.json` ni documentación.
  Sin `Co-Authored-By` de asistentes de IA.

## 6. Arquitectura consistente y escalable

- Sigue el patrón de capas ya establecido (secciones 2 y 2.1) para cualquier
  módulo nuevo — no introduzcas un segundo patrón de acceso a datos.
- Reutiliza componentes de `components/ui/` (basados en `@base-ui/react`, no
  Radix) antes de crear uno nuevo.
- No agregues abstracciones ni configuración especulativa para necesidades
  futuras hipotéticas — una fila nueva en el Excel debe seguir bastando para
  escalar el contenido, sin tocar código.

### Receta para un módulo nuevo (lo que hace escalable al proyecto)

1. Deja el `.xlsx` en `data/source-<modulo>/` y regístralo en
   `outputFileTracingIncludes` (`next.config.ts`).
2. Declara los tipos en `types/<modulo>.ts` — nunca dentro del datasource.
3. Declara el contrato (`<Modulo>DataSource`) en `datasource/types.ts`.
4. Escribe `datasource/excel-<modulo>-source.ts`: lee con
   `infrastructure/excel`, cachea con `CacheArchivo`, sin lógica de vista.
5. Regístralo en `datasource/index.ts` con `crearSingleton`.
6. Crea `repositories/<modulo>Repository.ts` como única puerta de entrada.
7. La página consume el repositorio; el componente recibe los datos por props.

Si un umbral o criterio lo necesitan servidor y vista, ponlo en `lib/reglas/`
desde el principio — no lo copies en ambos lados.

### Nomenclatura

- Código y comentarios en español, con tildes correctas; los identificadores
  técnicos (`slug`, `mtime`, `props`) se dejan como están.
- Archivos: `kebab-case.ts`, salvo los repositorios, que van en `camelCase.ts`
  (`accesosCaiRepository.ts`) por coherencia con los ya existentes.
- Nombres descriptivos y sin abreviar: `promedioDias`, no `promDias`.
- Un comentario explica **por qué**, no **qué**: si describe lo que el código ya
  dice, sobra. Los que documentan una decisión de datos (por qué se excluye una
  hoja, por qué un rango queda abierto) sí valen y no deben borrarse.

## 7. Cómo refactorizar sin romper nada


El comportamiento observable es el contrato: mismas cifras, misma interfaz,
mismo flujo. Procedimiento que ya se usó y funcionó:

1. **Captura una red de seguridad antes de tocar código**: un script temporal
   que llame a todos los puntos de entrada de datos (los repositorios) y vuelque
   el resultado a un JSON. Incluye casos con filtros que devuelvan cifras
   distintas entre sí — un snapshot donde todo da 0 no prueba nada.
2. **Refactoriza en pasos pequeños** y vuelve a generar el JSON después de cada
   uno: si el `diff` contra el baseline es vacío, no hubo regresión.
3. **Mide, no supongas**: instrumenta `readFileSync` para contar lecturas reales
   antes y después. "Parece más rápido" no es un criterio.
4. **Distingue lo que rompiste de lo que ya estaba roto**: `git stash` + build +
   prueba te dice si un warning o un error de consola es tuyo o preexistente.
   Nunca lo declares preexistente sin comprobarlo.
5. Verifica al final: `pnpm build` limpio, `pnpm exec tsc --noEmit` sin errores,
   `pnpm validar:metas` en verde y la prueba en WebKit real (sección 4).
6. Borra todo script temporal (`__*.ts`, `__*.mjs`) antes de terminar.

Antes de eliminar un archivo o carpeta, confirma que nada lo referencia — y
búscalo también fuera de `.ts`/`.tsx`: `shadcn` parecía una dependencia sin uso
hasta que se vio que `app/globals.css` la importa. Un `grep` que solo mira el
código de la aplicación no basta para declarar algo muerto.

Un cambio estructural solo se justifica si aporta un beneficio comprobable
(menos duplicación, menos acoplamiento, menos trabajo repetido). Refactorizar
por gusto estético no es motivo suficiente.

## 8. Ejecutable portable

`Compilar-Portable.bat` (raíz del repo) genera un `.exe` autocontenido y sin
instalación (`PlaneacionEstrategica2027-2037.exe`) a partir del proyecto.
Se regenera con ese script cada vez que el sitio cambie; el `.exe` compilado y
`launcher-src/portal.zip` nunca se versionan (ver `.gitignore`). El código
fuente del lanzador (`launcher-src/Program.cs`, compilado con el `csc.exe` que
ya trae Windows — sin instalar el SDK de .NET) sí se versiona.
