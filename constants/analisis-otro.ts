import type { PreguntaId } from "@/types/encuesta";

/**
 * Análisis cualitativo de las 125 respuestas abiertas ("Otro") de las
 * preguntas P3 (decisiones estratégicas a abordar) y P4 (visión a 10 años).
 *
 * La categorización se hizo respuesta por respuesta (tres lecturas
 * independientes + una síntesis, verificada contra los textos originales) y
 * se materializa en ASIGNACION_OTRO: un mapa de clave estable
 * "personaId:preguntaId:inicio-del-texto" → id de categoría. Los conteos se
 * calculan en vivo en el repositorio cruzando este mapa con las respuestas
 * actuales del Excel; una respuesta nueva o modificada que no esté en el mapa
 * cae en la categoría residual, de modo que el total siempre cuadra con los
 * datos vivos.
 */

export interface CategoriaOtro {
  id: string;
  nombre: string;
  descripcion: string;
  citas: string[];
}

export const CATEGORIA_RESIDUAL_OTRO = "otros-aportes";

export const CATEGORIAS_OTRO: CategoriaOtro[] = [
  {
    id: "entorno-empleabilidad-oferta",
    nombre: "Vínculo con el entorno, empleabilidad y oferta académica",
    descripcion:
      "Apertura de la universidad hacia afuera: prácticas y pasantías tempranas, salidas de campo, relación real con empresas y mercado laboral, emprendimiento, internacionalización y ampliación de la oferta de programas y posgrados.",
    citas: [
      "Hacer prácticas realmente con empresas para formar más a los estudiantes en el ámbito del trabajo",
      "Implementar pasantías o prácticas desde el cuarto semestre",
    ],
  },
  {
    id: "excelencia-investigacion",
    nombre: "Excelencia, acreditación e investigación",
    descripcion:
      "Aspiración a una universidad de alta calidad, acreditada y reconocida nacional e internacionalmente, con investigación, laboratorios y generación de nuevo conocimiento como sello institucional.",
    citas: [
      "En el top 10 de mejores universidades en Colombia y entre el top 50 de Latinoamérica",
      "Universidad con grandes y modernos laboratorios para hacer investigación",
    ],
  },
  {
    id: "docencia-bienestar",
    nombre: "Docencia, talento humano y bienestar",
    descripcion:
      "Calidad de la enseñanza y compromiso de los profesores, junto con su contratación, formalización y remuneración, y la dimensión humana de la comunidad: salud mental, bienestar y permanencia estudiantil.",
    citas: [
      "Tener profesores con mejor calidad de enseñanza",
      "Formalización de docentes, de manera que se promueva el sentido de pertenencia institucional",
    ],
  },
  {
    id: "modelo-educativo-curriculo",
    nombre: "Modelo educativo y currículo",
    descripcion:
      "Decisiones sobre el modelo MEDIT (consolidarlo, ajustarlo o replantearlo), revisión de pensum y lineamientos académicos, metodologías, evaluación y exigencia, e identidad curricular de los programas.",
    citas: [
      "Es fundamental fortalecer el modelo MEDIT",
      "Revisar la integración de los proyectos dentro del pensum",
    ],
  },
  {
    id: "infraestructura-gestion",
    nombre: "Infraestructura, recursos y gestión institucional",
    descripcion:
      "Necesidades físicas y operativas concretas (internet, aulas, escenarios deportivos, espacios y sedes) junto con burocracia, comunicación interna, manejo de recursos y sostenibilidad financiera.",
    citas: [
      "Ponerle techo a las canchas de la universidad",
      "Hay que mejorar la burocracia y los teléfonos",
    ],
  },
  {
    id: "alertas-declive",
    nombre: "Alertas y temor al declive institucional",
    descripcion:
      "Visiones pesimistas o escépticas del futuro: la universidad igual o peor, en decadencia, moderna en apariencia pero sin calidad de fondo, o afectada por decisiones percibidas como improvisadas.",
    citas: [
      "Cada vez más en decadencia",
      "La veo con mucha apariencia de moderna y digital, pero de fondo con muy poca calidad académica…",
    ],
  },
  {
    id: "otros-aportes",
    nombre: "Otros aportes",
    descripcion:
      "Respuestas sin contenido temático clasificable: \"todas las anteriores\", \"ninguna\", ecos de los lemas institucionales o visiones puramente personales.",
    citas: ["Todas las anteriores", "No sé qué agregar"],
  },
];

export const CONCLUSION_OTRO =
  "La comunidad universitaria, expresada en las 125 respuestas del diagnóstico 'Tu Voz Fundamental', muestra un cuadro de prioridades equilibrado. Tres ejes concentran más de la mitad de las voces, prácticamente empatados —entre el 16,8% y el 18,4% cada uno—: el vínculo con el entorno, la empleabilidad y una oferta académica más amplia; el impulso a la excelencia institucional, la acreditación y la investigación; y la mejora de las condiciones docentes, con mejor enseñanza, contratación, formalización, remuneración y bienestar. Juntas, definen un proyecto común que combina pertinencia social, rigor académico y valoración del talento humano.\n\nEl Modelo Educativo Digital Transmoderno (MEDIT) divide opiniones: una parte pide fortalecerlo y otra replantearlo, lo que conviene leer como un reto de apropiación interna que el plan debe atender con amplia participación. A este debate se suman dos asuntos con peso propio: la actualización curricular y la modernización de la infraestructura y la gestión (conectividad, aulas, escenarios deportivos, sedes, burocracia, comunicación y sostenibilidad financiera), que no pueden postergarse. Persiste además una visión minoritaria pero significativa —once respuestas (8,8%)— que anticipa una universidad en declive, una alerta que debe reconocerse sin dramatizar.\n\nPara el Plan Estratégico 2027–2037, la comunidad prioriza consolidar la pertinencia de la oferta y su conexión con el desarrollo regional; robustecer la investigación y los procesos de alta calidad; fortalecer la planta docente y el bienestar universitario; actualizar el currículo y abrir un diálogo genuino sobre el modelo pedagógico; y modernizar la infraestructura y la gestión institucional. Convertir estas líneas en compromiso colectivo será la mejor respuesta tanto a las demandas cotidianas como a la preocupación de fondo que expresa la minoría escéptica.";

/** Clave estable de una respuesta "Otro" dentro del mapa de asignación. */
export function claveRespuestaOtro(personaId: number, preguntaId: PreguntaId, texto: string): string {
  return `${personaId}:${preguntaId}:${texto.trim().slice(0, 24)}`;
}

export const ASIGNACION_OTRO: Record<string, string> = {
  "2996:P3:En la facultad de cienci": "entorno-empleabilidad-oferta",
  "8182:P4:Con más formaciones": "entorno-empleabilidad-oferta",
  "12741:P3:sostenibilidad en empleo": "entorno-empleabilidad-oferta",
  "7004:P3:Emprendimientos propios ": "entorno-empleabilidad-oferta",
  "8960:P3:Ofrecieron cursos comple": "entorno-empleabilidad-oferta",
  "12304:P3:Interactuar con el entor": "entorno-empleabilidad-oferta",
  "12668:P3:Más salidas a campo para": "entorno-empleabilidad-oferta",
  "7489:P3:Inversión en la expansió": "entorno-empleabilidad-oferta",
  "7056:P3:Hacer prácticas realment": "entorno-empleabilidad-oferta",
  "8599:P3:La formación profesional": "entorno-empleabilidad-oferta",
  "13116:P3:Acreditación de más prof": "entorno-empleabilidad-oferta",
  "13394:P3:Más apoyo y promoción en": "entorno-empleabilidad-oferta",
  "15212:P3:Una decisión estratégica": "entorno-empleabilidad-oferta",
  "11832:P4:universidad pública, no ": "entorno-empleabilidad-oferta",
  "12964:P4:Universidad publica con ": "entorno-empleabilidad-oferta",
  "6820:P3:Programas de intercambio": "entorno-empleabilidad-oferta",
  "6913:P3:Mas enfasis en las pract": "entorno-empleabilidad-oferta",
  "196:P4:epicentro de la transfor": "entorno-empleabilidad-oferta",
  "14487:P3:Mas oferta de carreras p": "entorno-empleabilidad-oferta",
  "9733:P4:Universidad con oferta a": "entorno-empleabilidad-oferta",
  "9216:P3:Materializar y consolida": "entorno-empleabilidad-oferta",
  "10315:P4:Universidad Translocal q": "entorno-empleabilidad-oferta",
  "5909:P4:Universidad que aplique ": "entorno-empleabilidad-oferta",
  "8468:P4:Universidad transformado": "excelencia-investigacion",
  "4941:P4:Que la universidad sea u": "excelencia-investigacion",
  "11585:P4:Universidad con fuerte p": "excelencia-investigacion",
  "3513:P4:Una universidad con mayo": "excelencia-investigacion",
  "9766:P4:Universidad con fuerte i": "excelencia-investigacion",
  "1148:P4:En el top 10 de mejores ": "excelencia-investigacion",
  "11247:P4:Universidad con gran acr": "excelencia-investigacion",
  "14209:P4:Universidad de alto re c": "excelencia-investigacion",
  "1788:P3:Construcción de nuevo co": "excelencia-investigacion",
  "51:P3:Gestora del conocimiento": "excelencia-investigacion",
  "51:P4:Universidad referente y ": "excelencia-investigacion",
  "2289:P4:Calidad real demostrada ": "excelencia-investigacion",
  "2308:P4:Investigación, una Unive": "excelencia-investigacion",
  "11354:P4:Acreditación institucion": "excelencia-investigacion",
  "7886:P3:Fortalecimiento de la In": "excelencia-investigacion",
  "7886:P4:Universidad con grandes ": "excelencia-investigacion",
  "8693:P4:Dando mucha prioridad y ": "excelencia-investigacion",
  "14757:P4:Que tenga calidad académ": "excelencia-investigacion",
  "15118:P3:mayor infraestructura en": "excelencia-investigacion",
  "15118:P4:Actualizada, con excelen": "excelencia-investigacion",
  "8143:P4:Una universidad de la cu": "excelencia-investigacion",
  "10501:P4:Universidad generadora d": "excelencia-investigacion",
  "6849:P4:Una universidad donde no": "docencia-bienestar",
  "10998:P3:La estabilidad y sanidad": "docencia-bienestar",
  "4639:P3:Cambiar la mayoría de la": "docencia-bienestar",
  "8334:P3:Tener profesores con mej": "docencia-bienestar",
  "6063:P3:mejorar los docentes en ": "docencia-bienestar",
  "6328:P3:SALUD MENTAL DE LOS CREA": "docencia-bienestar",
  "3144:P3:Bienestar y Permanencia ": "docencia-bienestar",
  "14209:P3:Formar en los valores y ": "docencia-bienestar",
  "6055:P3:Mejora de la enseñanza f": "docencia-bienestar",
  "1660:P3:Ética profesional en el ": "docencia-bienestar",
  "5534:P3:Remuneración e incentivo": "docencia-bienestar",
  "9683:P3:Formalización de docente": "docencia-bienestar",
  "11197:P3:Mejoramiento en calidad ": "docencia-bienestar",
  "11202:P4:Universidad completa en ": "docencia-bienestar",
  "11209:P4:Universidad que propende": "docencia-bienestar",
  "11224:P3:Contratación docente de ": "docencia-bienestar",
  "8267:P3:Se debe abordar el tema ": "docencia-bienestar",
  "8143:P3:Que los estudiantes y pr": "docencia-bienestar",
  "15148:P4:Universidad que posicion": "docencia-bienestar",
  "9473:P3:el talento humano para e": "docencia-bienestar",
  "9531:P4:Fortalecer presentacione": "docencia-bienestar",
  "4979:P3:Apuntar a indicadores al": "modelo-educativo-curriculo",
  "10542:P3:Mejora en el aprendizaje": "modelo-educativo-curriculo",
  "11475:P3:Revsion de los lineamien": "modelo-educativo-curriculo",
  "11585:P3:Refuerzos académicos a l": "modelo-educativo-curriculo",
  "3513:P3:Estudio y creación de pl": "modelo-educativo-curriculo",
  "9766:P3:Acordar una resignificac": "modelo-educativo-curriculo",
  "10178:P3:Y dejar de un lado el mé": "modelo-educativo-curriculo",
  "7218:P3:Todas las anteriores/evo": "modelo-educativo-curriculo",
  "13817:P3:Inducir más controles ev": "modelo-educativo-curriculo",
  "10770:P3:Particularidaes de los p": "modelo-educativo-curriculo",
  "196:P3:modelo educativo como ca": "modelo-educativo-curriculo",
  "204:P3:Revisar la integración d": "modelo-educativo-curriculo",
  "2289:P3:Calidad de la educación": "modelo-educativo-curriculo",
  "11386:P3:Revisión de la pertinenc": "modelo-educativo-curriculo",
  "9853:P3:Para el futuro de la UCu": "modelo-educativo-curriculo",
  "9853:P4:sin embargo, si no se im": "modelo-educativo-curriculo",
  "14997:P3:La calidad académica con": "modelo-educativo-curriculo",
  "11014:P3:todas las anteriores y C": "modelo-educativo-curriculo",
  "9053:P3:Es una universidad trans": "infraestructura-gestion",
  "2518:P3:Revisión de inversión en": "infraestructura-gestion",
  "4976:P3:Hay que mejorar la buroc": "infraestructura-gestion",
  "4976:P4:Ojalá que con mejor buro": "infraestructura-gestion",
  "3521:P3:Manejo de recursos en ge": "infraestructura-gestion",
  "5184:P3:Ponerle techo a las canc": "infraestructura-gestion",
  "5185:P3:Colocar un techo en las ": "infraestructura-gestion",
  "13872:P3:Transformación de espaci": "infraestructura-gestion",
  "9:P3:Infraestructura para gen": "infraestructura-gestion",
  "11202:P3:Funcionamiento interno (": "infraestructura-gestion",
  "1238:P3:Infraestructura": "infraestructura-gestion",
  "14670:P3:No intrusión de maquinar": "infraestructura-gestion",
  "1349:P3:Mejorar las aulas virtua": "infraestructura-gestion",
  "12546:P3:Imagen institucional der": "infraestructura-gestion",
  "10371:P3:La sostenibilidad de la ": "infraestructura-gestion",
  "22:P3:La articulación de vario": "infraestructura-gestion",
  "9817:P4:No puedo estar muy segur": "alertas-declive",
  "6708:P4:Igual que hoy en día, si": "alertas-declive",
  "6827:P4:Cada vez más en decadenc": "alertas-declive",
  "3585:P4:con falencias por el man": "alertas-declive",
  "8599:P4:Si sigue la universidad ": "alertas-declive",
  "11475:P4:Al ritmo al que va, en u": "alertas-declive",
  "10062:P4:Universidad hundida en e": "alertas-declive",
  "9365:P4:La verdad no veo que el ": "alertas-declive",
  "6428:P4:Muy mal de educación y f": "alertas-declive",
  "7226:P4:No estoy segura ya que c": "alertas-declive",
  "14925:P4:Igual o peor que la pres": "alertas-declive",
  "5524:P3:Todas las opciones son r": "otros-aportes",
  "5524:P4:Todas las opciones porqu": "otros-aportes",
  "4194:P4:Ya graduado desempeñando": "otros-aportes",
  "7296:P3:No se que agregar": "otros-aportes",
  "3555:P4:La veo como ambas transm": "otros-aportes",
  "8863:P4:Todas las anteriores": "otros-aportes",
  "13582:P3:No ninguna todas son fun": "otros-aportes",
  "11851:P3:Estudiantes": "otros-aportes",
  "14226:P3:Todas las anteriores": "otros-aportes",
  "4578:P4:Mediana": "otros-aportes",
  "9853:P4:como una universidad tra": "otros-aportes",
  "8169:P4:Ninguna": "otros-aportes",
  "9727:P4:Ninguna": "otros-aportes",
  "13473:P3:Todas": "otros-aportes",
};
