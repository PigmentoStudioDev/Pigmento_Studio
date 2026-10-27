import type { Locale } from "@/i18n/routing";
import type { ProjectCaseExtras } from "./project-case";

/**
 * HACK: contenido de ejemplo para revisar la plantilla del caso antes de que el CMS
 * tenga los campos (decision de Karen, 2026-10-27: plantilla primero con mock). Solo
 * entra en desarrollo y se aplica a cualquier proyecto sobre su galeria real. Se borra
 * cuando la coleccion `projects` modele capitulos, cifras, cita y creditos.
 */
const MOCK: Record<Locale, ProjectCaseExtras> = {
  es: {
    tagline: "Una marca que se reconoce antes de leer el nombre.",
    sector: "Gastronomia",
    location: "Ciudad de Mexico",
    liveUrl: "https://example.com",
    awards: ["Seleccion del jurado, Premio a Ejemplo 2025"],
    chapters: [
      {
        key: "problema",
        title: "El problema",
        paragraphs: [
          "Tres sucursales, tres logotipos y una carta distinta en cada una. Quien conocia una no reconocia las otras, y el cliente nuevo no tenia por donde entrar.",
          "Antes de dibujar nada habia que decidir que era la marca: lo que la hace distinta de la cocina de al lado, dicho en una frase.",
        ],
        media: [0],
      },
      {
        key: "estrategia",
        title: "La estrategia",
        paragraphs: [
          "Entrevistamos a los socios, al equipo de sala y a veinte clientes frecuentes. Todos describian lo mismo con palabras distintas: la mesa larga, el ruido, la cocina abierta.",
          "La marca salio de ahi. No de una tendencia, sino de lo que la gente ya contaba al salir.",
        ],
        media: [1, 2],
      },
      {
        key: "decisiones",
        title: "Las decisiones",
        paragraphs: ["Cada parte del proyecto tuvo una alternativa. Estas son las tres que definieron el resultado."],
        points: [
          { title: "Un sistema, no un logo", text: "Una tipografia propia y una reticula que funcionan igual en la carta, en la fachada y en una historia de Instagram." },
          { title: "El color de la cocina", text: "La paleta sale de los ingredientes de la carta. Cambia con la temporada sin dejar de ser la misma marca." },
          { title: "Menos piezas, mejor hechas", text: "Recortamos de cuarenta aplicaciones a doce. Las que quedaron se imprimen sin pruebas de color." },
        ],
        media: [3, 4, 5],
      },
      {
        key: "resultados",
        title: "Los resultados",
        paragraphs: [
          "A los seis meses del lanzamiento, las tres sucursales se leen como una sola casa y la cuarta abrio con la marca lista desde el primer dia.",
        ],
      },
    ],
    results: [
      { value: "+38%", label: "reservas en linea", context: "seis meses despues del lanzamiento" },
      { value: "3 → 1", label: "identidades", context: "una sola marca para las tres sucursales" },
      { value: "12", label: "aplicaciones", context: "de las cuarenta que habia antes" },
    ],
    quote: {
      quote: "Por primera vez la gente nos reconoce por la bolsa, no por la direccion.",
      author: "Nombre Apellido",
      role: "Socia fundadora",
    },
    credits: [
      { role: "Direccion creativa", name: "Nombre Apellido" },
      { role: "Diseno de identidad", name: "Nombre Apellido" },
      { role: "Motion", name: "Nombre Apellido" },
      { role: "Desarrollo web", name: "Nombre Apellido" },
    ],
  },
  en: {
    tagline: "A brand you recognise before you read the name.",
    sector: "Hospitality",
    location: "Mexico City",
    liveUrl: "https://example.com",
    awards: ["Jury selection, Example Award 2025"],
    chapters: [
      {
        key: "problem",
        title: "The problem",
        paragraphs: [
          "Three locations, three logos and a different menu in each. Anyone who knew one didn't recognise the others, and new guests had no way in.",
          "Before drawing anything we had to decide what the brand was: what sets it apart from the kitchen next door, in one sentence.",
        ],
        media: [0],
      },
      {
        key: "strategy",
        title: "The strategy",
        paragraphs: [
          "We interviewed the partners, the floor staff and twenty regulars. They all described the same thing in different words: the long table, the noise, the open kitchen.",
          "The brand came from there. Not from a trend, but from what people already said on their way out.",
        ],
        media: [1, 2],
      },
      {
        key: "decisions",
        title: "The decisions",
        paragraphs: ["Every part of the project had an alternative. These are the three that shaped the result."],
        points: [
          { title: "A system, not a logo", text: "A custom typeface and a grid that work the same on the menu, the storefront and an Instagram story." },
          { title: "The colour of the kitchen", text: "The palette comes from the menu's ingredients. It changes with the season and stays the same brand." },
          { title: "Fewer pieces, better made", text: "We cut forty applications down to twelve. The ones left print without colour proofs." },
        ],
        media: [3, 4, 5],
      },
      {
        key: "results",
        title: "The results",
        paragraphs: [
          "Six months after launch the three locations read as one house, and the fourth opened with the brand ready from day one.",
        ],
      },
    ],
    results: [
      { value: "+38%", label: "online bookings", context: "six months after launch" },
      { value: "3 → 1", label: "identities", context: "one brand for all three locations" },
      { value: "12", label: "applications", context: "down from forty" },
    ],
    quote: {
      quote: "For the first time people recognise us by the bag, not by the address.",
      author: "Name Surname",
      role: "Founding partner",
    },
    credits: [
      { role: "Creative direction", name: "Name Surname" },
      { role: "Identity design", name: "Name Surname" },
      { role: "Motion", name: "Name Surname" },
      { role: "Web development", name: "Name Surname" },
    ],
  },
};

export function mockCaseExtras(locale: Locale): ProjectCaseExtras {
  return process.env.NODE_ENV === "development" ? MOCK[locale] : {};
}
