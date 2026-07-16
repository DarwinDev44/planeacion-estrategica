# CLAUDE.md — Reglas del proyecto

Estas reglas aplican a todo el repositorio (`portal-web/` y el resto de carpetas) y
tienen prioridad sobre cualquier convención genérica. Léelas antes de tocar código.

## 1. Gestor de paquetes: pnpm — obligatorio

Nunca `npm` ni `yarn` ni `bun`, en ningún contexto (instalación, scripts, CI,
`npx`). Siempre `pnpm` / `pnpm add` / `pnpm dlx`. El proyecto fija el gestor en
`portal-web/package.json` (`packageManager`) y usa `pnpm-workspace.yaml` para
configuración de instalación (incluido `node-linker: hoisted` cuando se genera el
build portable — ver más abajo).

## 2. Arquitectura de datos: el Excel es la única fuente de verdad

- **Todos** los módulos leen su Excel en vivo con `fs` desde
  `portal-web/data/source-*/`. No hay JSON intermedios ni scripts ETL: editar el
  Excel se refleja en la siguiente petición, sin regenerar nada. No se
  reintroduzca un `data/*.json` con datos de negocio.
- Patrón de capas, siempre en este orden: `repositories/datasource/*.ts` (lee el
  Excel, sin lógica de negocio) → `repositories/xxxRepository.ts` (única puerta
  de entrada que los componentes pueden importar) → componentes.
- Agregar una fila/persona/actividad nueva debe bastar con editar el Excel (y,
  cuando aplique, soltar un archivo de foto con el slug correcto) — nunca
  hardcodear datos en componentes, constantes o datasources. Si un dato de
  negocio falta en el Excel (un nombre, una regla de exclusión), se agrega al
  Excel — no al código.
- Las rutas de los Excel son **siempre relativas** a `portal-web/`
  (`join(process.cwd(), "data", "source-*")`). Nunca una ruta absoluta del
  escritorio: Vercel corre en Linux y el `.exe` portable debe ser autocontenido,
  así que una ruta tipo `C:\Users\...` rompe ambos.
- Todo `data/source-*/` nuevo debe registrarse en `outputFileTracingIncludes`
  (`portal-web/next.config.ts`) o Vercel no empaqueta los `.xlsx` en el bundle
  serverless.
- Los archivos de trabajo sueltos que alguien deja en el escritorio para
  actualizar un Excel (fuera de este repo) nunca se versionan — solo su copia
  dentro de `portal-web/data/source-*/` es la fuente real que usa el sitio.

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

- Sigue el patrón de capas ya establecido (sección 2) para cualquier módulo
  nuevo — no introduzcas un segundo patrón de acceso a datos.
- Reutiliza componentes de `components/ui/` (basados en `@base-ui/react`, no
  Radix) antes de crear uno nuevo.
- No agregues abstracciones ni configuración especulativa para necesidades
  futuras hipotéticas — una fila nueva en el Excel debe seguir bastando para
  escalar el contenido, sin tocar código.
- Antes de eliminar un archivo o carpeta, confirma que ningún script de
  `portal-web/scripts/` ni componente lo referencia (los `.xlsx` crudos de la
  raíz del repo sí son necesarios para mantenimiento — no son basura aunque no
  los use la app en producción).

## 7. Ejecutable portable

`Compilar-Portable.bat` (raíz del repo) genera un `.exe` autocontenido y sin
instalación (`PlaneacionEstrategica2027-2037.exe`) a partir de `portal-web/`.
Se regenera con ese script cada vez que el sitio cambie; el `.exe` compilado y
`launcher-src/portal.zip` nunca se versionan (ver `.gitignore`). El código
fuente del lanzador (`launcher-src/Program.cs`, compilado con el `csc.exe` que
ya trae Windows — sin instalar el SDK de .NET) sí se versiona.
