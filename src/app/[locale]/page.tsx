import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Section } from "@/design-system/components/layout/Section/Section";
import { Faq } from "@/design-system/components/organisms/Faq/Faq";
import { FinalCta } from "@/design-system/components/organisms/FinalCta/FinalCta";
import { Manifesto } from "@/design-system/components/organisms/Manifesto/Manifesto";
import { Services } from "@/design-system/components/organisms/Services/Services";
import { Team } from "@/design-system/components/organisms/Team/Team";
import { ValueCards } from "@/design-system/components/organisms/ValueCards/ValueCards";
import { WorkRows } from "@/design-system/components/organisms/WorkRows/WorkRows";
import { HeroStatement } from "@/design-system/components/organisms/HeroStatement/HeroStatement";
import { HERO_PIECES } from "../hero";
import { Marquee } from "@/design-system/components/molecules/Marquee/Marquee";
import { getFinalCta } from "../cta";
import { getFaq } from "../faq";
import { getFeaturedPieces, getWorkProjects } from "@/cms/projects";
import { getManifesto } from "../manifesto";
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
  // Dos consultas independientes: en serie sumarian sus tiempos al primer byte.
  const [pieces, projects] = await Promise.all([getFeaturedPieces(locale), getWorkProjects(locale)]);
  const tValues = await getTranslations("home.values");
  const tWork = await getTranslations("home.work");
  const tServices = await getTranslations("home.services");
  const tTeam = await getTranslations("home.team");
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

      {/* Como trabaja el estudio, justo despues de decir que hace: las tarjetas siguen
          la frase sin cabecera de por medio y la contestan antes de ensenar el trabajo.
          A sangre por lo mismo que las filas: la corona sale por los bordes. */}
      <Section width="full" spacing="loose" spacingEnd="none" labelledBy={VALUES_TITLE_ID}>
        <ValueCards {...getValues(tValues)} titleId={VALUES_TITLE_ID} />
      </Section>

      {/* El trabajo, despues de decir que hacemos y antes de lo que se puede
          contratar: primero como se ve, luego la oferta. A sangre y
          sin techo: las filas salen por el borde de la ventana, y cortadas contra un
          contenedor de 1920 dejarian de leerse como algo que pasa por delante. Sin
          tema asignado: sigue al modo del sitio, como el resto de strips. */}
      <Section width="full" spacing="loose" spacingStart="none" surface="solid" labelledBy={WORK_TITLE_ID}>
        <WorkRows {...getWork(tWork, projects)} titleId={WORK_TITLE_ID} />
      </Section>

      {/* Lo que se puede contratar, justo despues de ver como se ve: quien acaba de
          mirar las piezas se pregunta que les puede pedir. Oscura en los dos modos:
          despues de la reticula, cuatro cabeceras iguales seguidas se leian como un
          documento, y el cambio de tono es lo que parte esa serie. */}
      <Section
        width="strip"
        spacing="loose"
        theme={{ light: "dark", dark: "dark" }}
        labelledBy={SERVICES_TITLE_ID}
      >
        <Services {...getServices(tServices)} titleId={SERVICES_TITLE_ID} />
      </Section>

      {/* Quien hace el trabajo, antes de las objeciones: la primera pregunta de
          cualquiera que va a contratar un estudio pequeno es con quien va a hablar. */}
      <Section width="strip" spacing="loose" labelledBy={TEAM_TITLE_ID}>
        <Team {...getTeam(tTeam)} titleId={TEAM_TITLE_ID} />
      </Section>

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
