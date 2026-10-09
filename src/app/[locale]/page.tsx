import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Section } from "@/design-system/components/layout/Section/Section";
import { Faq } from "@/design-system/components/organisms/Faq/Faq";
import { FinalCta } from "@/design-system/components/organisms/FinalCta/FinalCta";
import { Manifesto } from "@/design-system/components/organisms/Manifesto/Manifesto";
import { FeaturedCases } from "@/design-system/components/organisms/FeaturedCases/FeaturedCases";
import { Figures } from "@/design-system/components/organisms/Figures/Figures";
import { ImageBand } from "@/design-system/components/organisms/ImageBand/ImageBand";
import { Process } from "@/design-system/components/organisms/Process/Process";
import { Services } from "@/design-system/components/organisms/Services/Services";
import { Testimonials } from "@/design-system/components/organisms/Testimonials/Testimonials";
import { Team } from "@/design-system/components/organisms/Team/Team";
import { ValueCards } from "@/design-system/components/organisms/ValueCards/ValueCards";
import { WorkRows } from "@/design-system/components/organisms/WorkRows/WorkRows";
import { HeroStatement } from "@/design-system/components/organisms/HeroStatement/HeroStatement";
import { BAND_IMAGE_FILENAME } from "../band";
import { FEATURED_CASE_PIECES, FEATURED_CASES_MAX, getFeaturedCases } from "../featuredCases";
import { HERO_PIECES } from "../hero";
import { Marquee } from "@/design-system/components/molecules/Marquee/Marquee";
import { getFinalCta } from "../cta";
import { getFaq } from "../faq";
import { getFeaturedCases as readFeaturedCases, getFeaturedPieces, getWorkProjects } from "@/cms/projects";
import { getSiteImage } from "@/cms/media";
import { getTeamMembers } from "@/cms/team";
import { getFigures } from "../figures";
import { getManifesto } from "../manifesto";
import { getProcess } from "../process";
import { getTestimonials } from "../testimonials";
import { getServices } from "../services";
import { getTeam } from "../team";
import { getValues } from "../values";
import { getWork } from "../work";

/**
 * El hero va en la RUTA y no en `app/layout.tsx`: en el layout raiz saldria tambien
 * en /ds y en el 404. Es ademas lo que dice el contrato de modularidad — a un
 * organismo lo monta una ruta, porque un organismo es un bloque de pagina.
 *
 * El `Section` que lo envuelve es quien pone el ritmo: a sangre y sin padding
 * propio. El organismo no decide ni su hueco ni su tema, para que el dia que Payload
 * arme la pagina el espacio entre bloques dependa del orden y no de cuales sean.
 */
/**
 * EL COLOR, repartido por la pagina y no por cada bloque.
 *
 * Cada strip resalta un trozo de su titular; hasta ahora las siete lo hacian con el
 * mismo azul palido del tema, y el color del sistema —las familias candy— vivia
 * encerrado en las tarjetas de valores, que son UN bloque. La pagina era gris sobre
 * blanco de arriba abajo con una isla de color en medio.
 *
 * El orden es el de `CANDY_CYCLE`, que alterna calidos y frios justo para que dos
 * bloques seguidos no caigan en el mismo tono. Se escriben literales y no con
 * `candyAt(i)` porque aqui lo que importa es poder LEER el reparto de un vistazo y
 * cambiar uno sin recolocar los demas; el ciclo sigue siendo quien dice cuales son y
 * en que orden van.
 *
 * El manifiesto gasta las cuatro primeras en sus palabras calientes, asi que la
 * pagina entera recorre el ciclo dos veces: una en una frase, otra en siete strips.
 */
/** Las anclas que atan cada <section> con su titular. */
const VALUES_TITLE_ID = "valores";
const WORK_TITLE_ID = "trabajo";
const SERVICES_TITLE_ID = "servicios";
const PROCESS_TITLE_ID = "proceso";
const CASE_TITLE_ID = "caso";
const TESTIMONIALS_TITLE_ID = "clientes";
const TEAM_TITLE_ID = "equipo";
const FAQ_TITLE_ID = "faq";
const CTA_TITLE_ID = "contacto";

export default async function Home({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;

  // La misma guarda que el layout. Es redundante en ejecucion —el layout ya
  // llamo a notFound()— y aun asi va: es lo que estrecha `string` al par de
  // idiomas reales, y sin ella el tipo del CMS lo tendria que dar un cast, que
  // es afirmar en vez de comprobar.
  if (!hasLocale(routing.locales, locale)) notFound();

  // Sin esto la ruta se vuelve dinamica: leer traducciones cuenta como leer cabeceras
  // salvo que el segmento este entre los generados de antemano.
  setRequestLocale(locale);

  const t = await getTranslations("home.manifesto");

  // Las mismas piezas que el escaparate del menu, y ahi esta la gracia: el
  // manifiesto ensena trabajo dos strips antes del portafolio sin duplicarlo.
  // Consultas independientes: en serie sumarian sus tiempos al primer byte.
  const [pieces, projects, teamMembers, bandImage, featuredCases] = await Promise.all([
    getFeaturedPieces(locale),
    getWorkProjects(locale),
    getTeamMembers(locale),
    getSiteImage(BAND_IMAGE_FILENAME, locale),
    readFeaturedCases(locale, FEATURED_CASE_PIECES, FEATURED_CASES_MAX),
  ]);
  const tValues = await getTranslations("home.values");
  const tWork = await getTranslations("home.work");
  const tServices = await getTranslations("home.services");
  const tFigures = await getTranslations("home.figures");
  const tProcess = await getTranslations("home.process");
  const tFeaturedCase = await getTranslations("home.featuredCase");
  const tTestimonials = await getTranslations("home.testimonials");
  const team = getTeam(await getTranslations("home.team"), teamMembers);
  const tFaq = await getTranslations("home.faq");
  const tCta = await getTranslations("home.cta");

  return (
    <main>
      {/* Solo el hero A en la pagina. El B (HeroExpose, la reticula con el titular al
          centro) sigue en el design system por si la comparativa vuelve: montarlo es
          volver a importarlo aqui. */}
      <Section width="full" spacing="none">
        <HeroStatement
          eyebrow="Diseño de marca y crecimiento"
          title="Diseñamos marcas con visión de futuro."
          titleHighlight="visión de futuro"
          subtitle="Estrategia, diseño y tecnología trabajando juntos para convertir ideas en marcas que crecen, evolucionan y perduran."
          ctaLabel="Empezar un proyecto"
          ctaHref={`#${CTA_TITLE_ID}`}
          pieces={HERO_PIECES}
        />
      </Section>

      {/* Debajo del hero, y a sangre: una tira que se cortara contra un contenedor
          dejaria de leerse como una cinta continua. Sin tema asignado: la tira sigue
          al modo del sitio en los dos. */}
      <Section width="full" spacing="none">
        <Marquee
          kind="logos"
          direction="left"
          items={[
            { src: "/logos/twitter.svg", alt: "Twitter", width: 100, height: 81 },
            { src: "/logos/behance.svg", alt: "Behance", width: 201, height: 38 },
            { src: "/logos/medium.svg", alt: "Medium", width: 200, height: 32 },
            { src: "/logos/eventbrite.svg", alt: "Eventbrite", width: 200, height: 37 },
            { src: "/logos/android.svg", alt: "Android", width: 200, height: 44 },
            { src: "/logos/bluesky.svg", alt: "Bluesky", width: 126, height: 111 },
            { src: "/logos/chatgpt.svg", alt: "ChatGPT", width: 100, height: 100 },
            { src: "/logos/apple.svg", alt: "Apple", width: 74, height: 91 },
          ]}
        />
      </Section>

      {/* La frase que dice a que se dedica el estudio, y colgando de ella las cifras.
          Va aqui, entre la tira de logos y los servicios: primero quien confia, luego
          que hacemos, y el trabajo dos bloques mas abajo.

          Las cifras ENTRAN AQUI y no en una strip propia. Tenian una, con su titular
          —"Lo que deja el trabajo"— y su intro: una pantalla entera de anuncio delante
          de cuatro numeros que se explican solos, en una pagina cuyo problema es
          justamente que anuncia mas de lo que ensena. Debajo de la frase que dice a
          que se dedica el estudio se leen como su respaldo, que es lo que son. */}
      <Section spacing="loose" width="wide">
        <Manifesto {...getManifesto(t, pieces)} />
        <Figures {...getFigures(tFigures)} />
      </Section>

      {/* El trabajo, despues de decir que hacemos y antes de lo que se puede
          contratar: primero como se ve, luego la oferta. A sangre y
          sin techo: las filas salen por el borde de la ventana, y cortadas contra un
          contenedor de 1920 dejarian de leerse como algo que pasa por delante. Sin
          tema asignado: sigue al modo del sitio, como el resto de strips. */}
      <Section width="full" spacing="loose" spacingEnd="default" surface="solid" labelledBy={WORK_TITLE_ID}>
        <WorkRows {...getWork(tWork, projects)} titleId={WORK_TITLE_ID} highlightFamily="periwinkle" />
      </Section>

      {/* ACTO III — la oferta y como se trabaja. Empieza aqui: quien acaba de ver las
          piezas y sus cifras se pregunta que les puede pedir.

          SIN tono propio: servicios y proceso llevaban `raised` para marcar capitulo y
          lo que hacian de verdad era dejar dos pantallas de gris corrido con una foto
          en medio. Lo que separa este acto del anterior ya no es el tono — es la banda
          de imagen, que esta justo dentro, y la guia trazada del proceso. El gris se
          reserva ahora para lo unico que lo necesita de verdad: ser FONDO de unas
          tarjetas blancas. */}
      <Section
        width="strip"
        spacing="loose"
        spacingEnd="default"
        labelledBy={SERVICES_TITLE_ID}
      >
        <Services {...getServices(tServices)} titleId={SERVICES_TITLE_ID} highlightFamily="tangerine" />
      </Section>

      {/* El respiro, y la unica seccion de la pagina sin nada que leer.

          Va entre estos dos y no mas abajo, que es donde estaba. Una banda entrega al
          bloque que tiene debajo, asi que ese bloque tiene que ORIENTAR: debajo de la
          corona de valores no hay titular —su `h2` es `visually-hidden`— y se aterrizaba
          en unas tarjetas girando sin nada que dijera de que van. Aqui entrega a "Como
          trabajamos", que abre con titular, rotulo y entrada.

          Lo que gana ademas es que deja de ser solo una pausa: a sangre y justo encima
          de un titular grande, la imagen se lee como la PORTADA del proceso. Y sigue
          haciendo su trabajo de superficie, y desde que servicios y proceso dejaron el
          gris es la UNICA cosa que separa esos dos bloques: de servicios a la llamada
          final son siete bloques seguidos que piden atencion y este es el unico sitio
          donde no hay nada que procesar.

          La banda no lleva aire propio por ningun lado: con fondo distinto ella ES la
          separacion, y un margen alrededor la convertiria en una caja puesta encima.
          Las tres superficies se tocan. El aire que se ve arriba y abajo es el relleno
          de Servicios y de Proceso dentro de SU propia banda, que es donde tiene que
          estar — un titular contra el borde de una foto no se lee.

          Sin imagen no se pinta: medio viewport de hueco vacio es peor que no tener
          respiro. */}
      {bandImage ? (
        <Section width="full" spacing="none">
          <ImageBand {...bandImage} />
        </Section>
      ) : null}

      {/* Sigue el ACTO III: lo que se contrata y como se lleva son la misma respuesta
          partida en dos bloques, y lo que los separa es la banda, que no es aire sino
          superficie. Tampoco lleva tono — la guia que se traza con el scroll es lo que
          distingue a este bloque, y no hacia falta ademas pintarlo de gris. */}
      <Section
        width="strip"
        spacing="loose"
        spacingStart="default"
        labelledBy={PROCESS_TITLE_ID}
      >
        <Process {...getProcess(tProcess)} titleId={PROCESS_TITLE_ID} highlightFamily="cyan" />
      </Section>

      {/* ACTO IV — por que nosotros. Abre la corona de valores, que es la salida del
          capitulo anterior: vuelve al tono del sitio y sale por los bordes, asi que el
          cambio se nota sin necesitar otro filete. */}
      <Section width="full" spacing="loose" labelledBy={VALUES_TITLE_ID}>
        <ValueCards {...getValues(tValues)} titleId={VALUES_TITLE_ID} highlightFamily="pink" />
      </Section>

      {/* LA COMPARATIVA SALIO DE LA HOME. Era una <table> de ocho criterios contra
          "agencia grande" y "freelance": en una propuesta comercial eso se lee como
          criterio, y en una home se lee como un informe. La pagina ya arrastraba el
          diagnostico de parecer un PDF, y era el bloque que mas lo sostenia.

          No se borro nada: `Difference` y su copia siguen enteros, con sus tests, y
          la comparativa es exactamente el material de una pagina de servicios, que es
          donde alguien la busca. Volver a ponerla aqui es una linea.

          Lo que ocupaba su sitio en el argumento lo hacen ya dos bloques que SI son
          web: los casos con sus piezas y las resenas firmadas. */}

      {/* Quien lo dice. Tras la corona de valores, que es lo ultimo que el estudio
          afirma de si mismo, y antes de los casos, que es lo que lo demuestra.

          En `raised` y sola: aqui el tono no marca capitulo, hace de FONDO. Las
          resenas son tarjetas blancas, y una tarjeta blanca sobre una pagina blanca
          no es una tarjeta. Es la misma figura contra fondo que usan las preguntas al
          final. Sin citas publicadas la seccion no se pinta. */}
      <Section
        width="strip"
        spacing="default"
        theme={{ light: "raised", dark: "raised" }}
        labelledBy={TESTIMONIALS_TITLE_ID}
      >
        <Testimonials {...getTestimonials(tTestimonials)} titleId={TESTIMONIALS_TITLE_ID} highlightFamily="lime" />
      </Section>

      {/* Y el trabajo que lo sostiene, cerrando el capitulo.

          La pagina enseña el trabajo una vez, en el primer tercio, y despues
          argumenta durante seis secciones sin una sola imagen. Aqui vuelve, y vuelve
          justo detras de las dos secciones donde el estudio mas afirma: la comparativa
          dice en que se diferencia, la cita lo confirma, y esto lo demuestra.

          Detras de las resenas y no delante: el gris de esa seccion es el fondo de sus
          tarjetas, y el caso vuelve al tono del sitio, asi que el cambio de superficie
          es ademas lo que dice que acabo de hablar el cliente y empieza el trabajo.

          **No es un segundo strip.** Arriba pasan dieciocho portadas sin detenerse en
          ninguna; aqui se para en cada una y se ven sus piezas, con el texto que el
          propio CMS tiene escrito del proyecto. Dos formatos distintos del mismo
          material, que es lo que hace que el trabajo pueda volver sin repetirse.

          Ningun caso con galeria y texto no se pinta: con las portadas solas seria el
          strip otra vez. */}
      {featuredCases.length > 0 ? (
        <Section width="strip" spacing="default" spacingStart="loose" labelledBy={CASE_TITLE_ID}>
          <FeaturedCases
            {...getFeaturedCases(tFeaturedCase, tWork, featuredCases)}
            titleId={CASE_TITLE_ID}
          />
        </Section>
      ) : null}

      {/* Quien hace el trabajo, antes de las objeciones: la primera pregunta de
          cualquiera que va a contratar un estudio pequeno es con quien va a hablar.
          Sin nadie publicado en el CMS no se pinta. */}
      {team ? (
        <Section width="strip" spacing="default" spacingEnd="loose" labelledBy={TEAM_TITLE_ID}>
          <Team {...team} titleId={TEAM_TITLE_ID} highlightFamily="amber" />
        </Section>
      ) : null}

      {/* Las objeciones, al final: quien llega hasta aqui ya sabe que hacemos y
          esta decidiendo, no explorando. A sangre porque la lista se escanea de un
          borde al otro. `labelledBy` convierte el <section> en un landmark con
          nombre, y quien pone ese nombre es el titular del bloque. */}
      {/* Sin tono: el mismo fondo que el pie, que es lo que tiene justo debajo. Un
          escalon de gris aqui partiria en dos lo que se lee como un solo cierre.
          La separacion la da la TARJETA de las preguntas, que sobre la base del sitio
          sale en la capa -01 — gris sobre blanco. */}
      <Section width="strip" spacing="loose" labelledBy={FAQ_TITLE_ID}>
        <Faq {...getFaq(tFaq)} titleId={FAQ_TITLE_ID} highlightFamily="periwinkle" />
      </Section>

      {/* La ultima llamada, pegada al pie. La placa se despega de la pagina con el rol
          invertido: oscura sobre claro y clara sobre oscuro — lo que la hace placa es
          el contraste, no un color fijo. */}
      <Section width="strip" spacing="loose" labelledBy={CTA_TITLE_ID}>
        <FinalCta {...getFinalCta(tCta)} titleId={CTA_TITLE_ID} />
      </Section>

    </main>
  );
}
