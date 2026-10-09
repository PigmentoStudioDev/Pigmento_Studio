import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Section } from "@/design-system/components/layout/Section/Section";
import { Faq } from "@/design-system/components/organisms/Faq/Faq";
import { FinalCta } from "@/design-system/components/organisms/FinalCta/FinalCta";
import { Manifesto } from "@/design-system/components/organisms/Manifesto/Manifesto";
import { Difference } from "@/design-system/components/organisms/Difference/Difference";
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
import { HERO_PIECES } from "../hero";
import { Marquee } from "@/design-system/components/molecules/Marquee/Marquee";
import { getFinalCta } from "../cta";
import { getFaq } from "../faq";
import { getFeaturedPieces, getWorkProjects } from "@/cms/projects";
import { getSiteImage } from "@/cms/media";
import { getTeamMembers } from "@/cms/team";
import { getDifference } from "../difference";
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
/** Las anclas que atan cada <section> con su titular. */
const VALUES_TITLE_ID = "valores";
const WORK_TITLE_ID = "trabajo";
const SERVICES_TITLE_ID = "servicios";
const FIGURES_TITLE_ID = "cifras";
const PROCESS_TITLE_ID = "proceso";
const DIFFERENCE_TITLE_ID = "diferencia";
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
  const [pieces, projects, teamMembers, bandImage] = await Promise.all([
    getFeaturedPieces(locale),
    getWorkProjects(locale),
    getTeamMembers(locale),
    getSiteImage(BAND_IMAGE_FILENAME, locale),
  ]);
  const tValues = await getTranslations("home.values");
  const tWork = await getTranslations("home.work");
  const tServices = await getTranslations("home.services");
  const tFigures = await getTranslations("home.figures");
  const tProcess = await getTranslations("home.process");
  const tDifference = await getTranslations("home.difference");
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

      {/* La frase que dice a que se dedica el estudio. Va aqui, entre la tira de
          logos y los servicios: primero quien confia, luego que hacemos, y el
          trabajo dos bloques mas abajo. */}
      <Section spacing="loose" width="wide">
        <Manifesto {...getManifesto(t, pieces)} />
      </Section>

      {/* El trabajo, despues de decir que hacemos y antes de lo que se puede
          contratar: primero como se ve, luego la oferta. A sangre y
          sin techo: las filas salen por el borde de la ventana, y cortadas contra un
          contenedor de 1920 dejarian de leerse como algo que pasa por delante. Sin
          tema asignado: sigue al modo del sitio, como el resto de strips. */}
      <Section width="full" spacing="loose" spacingEnd="default" surface="solid" labelledBy={WORK_TITLE_ID}>
        <WorkRows {...getWork(tWork, projects)} titleId={WORK_TITLE_ID} />
      </Section>

      {/* Las cifras, pegadas al trabajo: quien acaba de ver las piezas se pregunta si
          funcionan, y un numero contesta eso antes que un parrafo.

          Mismo fondo liso que la reticula y sin aire grande entre las dos — son un
          solo acto, la prueba. El grano aqui volvia a aparecer justo debajo de una
          franja que lo quitaba a proposito. */}
      <Section
        width="strip"
        spacing="default"
        spacingStart="none"
        surface="solid"
        labelledBy={FIGURES_TITLE_ID}
      >
        <Figures {...getFigures(tFigures)} titleId={FIGURES_TITLE_ID} />
      </Section>

      {/* ACTO III — la oferta y como se trabaja. Empieza aqui: quien acaba de ver las
          piezas y sus cifras se pregunta que les puede pedir.

          El tono `raised` abarca ESTE bloque y el siguiente, y esa es la decision: un
          corte que dura una seccion se lee como un accidente, no como un capitulo.
          Antes solo cortaba Servicios y Proceso volvia al modo justo detras.

          `raised` y no oscuro fijo. Oscuro fijo contrasta en claro y se disuelve en
          oscuro —el capitulo desaparecia justo para quien navega de noche—, e invertir
          significaria blanco a pantalla completa sobre una pagina negra. `raised` sube
          un escalon dentro del modo: g10 sobre claro, g90 sobre oscuro, y el mismo
          ritmo en los dos. */}
      <Section
        width="strip"
        spacing="loose"
        spacingEnd="default"
        theme={{ light: "raised", dark: "raised" }}
        labelledBy={SERVICES_TITLE_ID}
      >
        <Services {...getServices(tServices)} titleId={SERVICES_TITLE_ID} />
      </Section>

      {/* El respiro, y la unica seccion de la pagina sin nada que leer.

          Va entre estos dos y no mas abajo, que es donde estaba. Una banda entrega al
          bloque que tiene debajo, asi que ese bloque tiene que ORIENTAR: debajo de la
          corona de valores no hay titular —su `h2` es `visually-hidden`— y se aterrizaba
          en unas tarjetas girando sin nada que dijera de que van. Aqui entrega a "Como
          trabajamos", que abre con titular, rotulo y entrada.

          Lo que gana ademas es que deja de ser solo una pausa: a sangre y justo encima
          de un titular grande, la imagen se lee como la PORTADA del proceso. Y sigue
          haciendo su trabajo de capa —base, `raised` e imagen son las tres superficies
          de la pila—, porque de servicios a la llamada final son ocho bloques seguidos
          que piden atencion y este es el unico sitio donde no hay nada que procesar.

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

      {/* Sigue el ACTO III, con el mismo tono: lo que se contrata y como se lleva son
          la misma respuesta partida en dos bloques, y el aire de capitulo va fuera del
          acto. Lo que los separa ahora es la banda, que no es aire sino superficie. */}
      <Section
        width="strip"
        spacing="loose"
        spacingStart="default"
        theme={{ light: "raised", dark: "raised" }}
        labelledBy={PROCESS_TITLE_ID}
      >
        <Process {...getProcess(tProcess)} titleId={PROCESS_TITLE_ID} />
      </Section>

      {/* ACTO IV — por que nosotros. Abre la corona de valores, que es la salida del
          capitulo anterior: vuelve al tono del sitio y sale por los bordes, asi que el
          cambio se nota sin necesitar otro filete. */}
      <Section width="full" spacing="loose" labelledBy={VALUES_TITLE_ID}>
        <ValueCards {...getValues(tValues)} titleId={VALUES_TITLE_ID} />
      </Section>

      {/* La comparativa, al final del argumento y no al principio: solo se discute
          con quien ya vio el trabajo, la oferta y el proceso. Antes de eso es una
          tabla que gana sola.

          Aire de parrafo con lo que viene detras, no de capitulo: comparativa,
          testimonios y equipo son tres maneras de contestar la misma pregunta, y con
          el aire grande entre las tres se leian como tres temas distintos.

          Y en `raised`, igual que la oferta y el proceso. Tras la banda venian SEIS
          secciones blancas seguidas —valores, comparativa, testimonios, equipo,
          preguntas y llamada— y la pila volvia a leerse como una sola superficie: la
          alternancia pide una banda secundaria cada dos o tres secciones, no una por
          pagina.

          **El tono abarca esta y la siguiente**, que es la misma regla que ya gobierna
          servicios y proceso: un corte que dura una seccion se lee como un accidente y
          no como un capitulo. Y las dos van juntas por su contenido, no para rellenar
          el par — la tabla es lo que el estudio afirma de si mismo y la cita firmada es
          lo unico que la sostiene. */}
      <Section
        width="strip"
        spacing="default"
        spacingStart="loose"
        theme={{ light: "raised", dark: "raised" }}
        labelledBy={DIFFERENCE_TITLE_ID}
      >
        <Difference {...getDifference(tDifference)} titleId={DIFFERENCE_TITLE_ID} />
      </Section>

      {/* Y quien lo dice, justo detras: la tabla es lo que el estudio afirma de si
          mismo, y una cita firmada es lo unico que la sostiene. Sin citas publicadas
          la seccion no se pinta. Cierra el capitulo `raised` que abrio la comparativa. */}
      <Section
        width="strip"
        spacing="default"
        theme={{ light: "raised", dark: "raised" }}
        labelledBy={TESTIMONIALS_TITLE_ID}
      >
        <Testimonials {...getTestimonials(tTestimonials)} titleId={TESTIMONIALS_TITLE_ID} />
      </Section>

      {/* Quien hace el trabajo, antes de las objeciones: la primera pregunta de
          cualquiera que va a contratar un estudio pequeno es con quien va a hablar.
          Sin nadie publicado en el CMS no se pinta. */}
      {team ? (
        <Section width="strip" spacing="default" spacingEnd="loose" labelledBy={TEAM_TITLE_ID}>
          <Team {...team} titleId={TEAM_TITLE_ID} />
        </Section>
      ) : null}

      {/* Las objeciones, al final: quien llega hasta aqui ya sabe que hacemos y
          esta decidiendo, no explorando. A sangre porque la lista se escanea de un
          borde al otro. `labelledBy` convierte el <section> en un landmark con
          nombre, y quien pone ese nombre es el titular del bloque. */}
      <Section width="strip" spacing="loose" labelledBy={FAQ_TITLE_ID}>
        <Faq {...getFaq(tFaq)} titleId={FAQ_TITLE_ID} />
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
