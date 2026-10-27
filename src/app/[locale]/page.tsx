import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Section } from "@/design-system/components/layout/Section/Section";
import { FinalCta } from "@/design-system/components/organisms/FinalCta/FinalCta";
import { Manifesto } from "@/design-system/components/organisms/Manifesto/Manifesto";
import { ImageBand } from "@/design-system/components/organisms/ImageBand/ImageBand";
import { Services } from "@/design-system/components/organisms/Services/Services";
import { Testimonials } from "@/design-system/components/organisms/Testimonials/Testimonials";
import { ValueCards } from "@/design-system/components/organisms/ValueCards/ValueCards";
import { Marquee } from "@/design-system/components/molecules/Marquee/Marquee";
import { WorkRows } from "@/design-system/components/organisms/WorkRows/WorkRows";
import { HeroStatement } from "@/design-system/components/organisms/HeroStatement/HeroStatement";
import { BAND_IMAGE_FILENAME } from "../band";
import { getHero } from "../hero";
import { getFinalCta } from "../cta";
import { sendContact } from "../contact-action";
import { getFeaturedPieces, getWorkProjects } from "@/cms/projects";
import { getSiteImage } from "@/cms/media";
import { getTeamMembers } from "@/cms/team";
import { getManifesto } from "../manifesto";
import { getTestimonials } from "../testimonials";
import { getServices } from "../services";
import { getValues } from "../values";
import { getWork } from "../work";
import { alternatesFor } from "../seo";

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
const CTA_TITLE_ID = "contacto";

// Titulo y descripcion los hereda del layout; lo propio de la home es su canonical y
// la pareja de idiomas, que el layout no puede saber por ruta.
export async function generateMetadata({ params }: PageProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  return { alternates: alternatesFor("/", locale) };
}

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
  const [pieces, projects, bandImage, members] = await Promise.all([
    getFeaturedPieces(locale),
    getWorkProjects(locale),
    getSiteImage(BAND_IMAGE_FILENAME, locale),
    getTeamMembers(locale),
  ]);
  const tHero = await getTranslations("home.hero");
  const tValues = await getTranslations("home.values");
  const tWork = await getTranslations("home.work");
  const tServices = await getTranslations("home.services");
  const tBand = await getTranslations("home.band");
  const tTestimonials = await getTranslations("home.testimonials");
  const tCta = await getTranslations("home.cta");
  const testimonials = getTestimonials(tTestimonials);

  return (
    <main id="main">
      {/* Solo el hero A en la pagina. El B (HeroExpose, la reticula con el titular al
          centro) sigue en el design system por si la comparativa vuelve: montarlo es
          volver a importarlo aqui. */}
      <Section width="full" spacing="none">
        <HeroStatement {...getHero(tHero, `#${CTA_TITLE_ID}`)} highlightFamily="pink" />
      </Section>

      {/* La tira de clientes va aqui, debajo del hero, como en bunch, peak y mammut, y
          vuelve con LOGOS de clientes reales. Los de plataformas (Twitter, Apple...)
          tenian la forma correcta y el contenido falso; los nombres en texto, al reves. */}

      {/* La frase que dice a que se dedica el estudio. Va aqui, entre la tira de logos
          y los servicios: primero que hacemos, y el trabajo dos
          bloques mas abajo. Las cifras que colgaban de ella se fueron a /nosotros
          (reunion con Pigmento, 2026-10-22): son del estudio, no de la oferta. */}
      <Section spacing="loose" width="wide">
        <Manifesto {...getManifesto(t, pieces)} />
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
        width="wide"
        spacing="loose"
        spacingEnd="default"
        labelledBy={SERVICES_TITLE_ID}
      >
        <Services {...getServices(tServices)} titleId={SERVICES_TITLE_ID} />
      </Section>

      {/* El respiro, y la unica seccion de la pagina sin nada que leer. Entrega a las
          resenas, que van pegadas a ella: la banda es la unica superficie que no pide
          nada a cambio, y justo despues una fila de citas se lee como su respaldo.

          Sin aire propio por ningun lado: con fondo distinto ella ES la separacion, y
          un margen alrededor la convertiria en una caja puesta encima. Sin imagen no se
          pinta: medio viewport de hueco vacio es peor que no tener respiro. */}
      {bandImage ? (
        <Section width="full" spacing="none">
          <ImageBand {...bandImage} title={tBand("title")} />
        </Section>
      ) : null}

      {/* Quien lo dice, PEGADO a la banda y sin cabecera.

          Estaba al final, entre los valores y los casos, con titular, rotulo y
          entradilla como las otras ocho strips — una pantalla entera para presentar
          seis frases que se presentan solas. Aqui hace un trabajo que alli no hacia:
          la banda es la unica superficie de la pagina que no pide nada a cambio, y
          justo despues de ella una fila de resenas se lee como el respaldo de lo que
          se acaba de ver, no como otra seccion que argumenta.

          Sin aire arriba, por lo mismo que la banda no lo lleva: las dos superficies
          se tocan y ese contacto ES la separacion. Sin citas no se pinta, asi que el
          hueco tampoco queda. */}
      {testimonials.testimonials.length > 0 ? (
        <Section width="full" spacing="loose" spacingStart="none">
          <Testimonials {...testimonials} />
        </Section>
      ) : null}

      {/* El proceso salio de aqui a las paginas de servicio (reunion con Pigmento,
          2026-10-22): cada disciplina tiene sus fases y su entregable, y uno general en
          la home repetia en abstracto lo que alli se dice en concreto. */}

      {/* ACTO IV — por que nosotros. Abre la corona de valores, que es la salida del
          capitulo anterior: vuelve al tono del sitio y sale por los bordes, asi que el
          cambio se nota sin necesitar otro filete. */}
      {/* Sin aire abajo, y la strip siguiente sin aire arriba: la rueda ya trae su
          propio hueco en el arco y con los dos paddings la pagina se partia ahi
          (decision de Karen, 2026-10-26). */}
      <Section width="full" spacing="loose" spacingEnd="none" labelledBy={VALUES_TITLE_ID}>
        <ValueCards {...getValues(tValues, members)} titleId={VALUES_TITLE_ID} highlightFamily="pink" />
      </Section>

      {/* La tira de logos vuelve debajo de los valores, a sangre y oscura en los dos
          modos (decision de Karen, 2026-10-26). Los logos llegan en blanco, listos para
          ese fondo. */}
      <Section width="full" spacing="none">
        <Marquee
          kind="logos"
          direction="left"
          theme={{ light: "dark", dark: "dark" }}
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

      {/* LA COMPARATIVA SALIO DE LA HOME. Era una <table> de ocho criterios contra
          "agencia grande" y "freelance": en una propuesta comercial eso se lee como
          criterio, y en una home se lee como un informe. La pagina ya arrastraba el
          diagnostico de parecer un PDF, y era el bloque que mas lo sostenia.

          No se borro nada: `Difference` y su copia siguen enteros, con sus tests, y
          la comparativa es exactamente el material de una pagina de servicios, que es
          donde alguien la busca. Volver a ponerla aqui es una linea.

          Lo que ocupaba su sitio en el argumento lo hacen ya dos bloques que SI son
          web: los casos con sus piezas y las resenas firmadas. */}

      {/* LOS CASOS DESTACADOS SALIERON DE LA HOME (decision de Karen, 2026-10-26). No se
          borro nada: `FeaturedCases`, su copia y `getFeaturedCases` siguen enteros, con
          sus tests. Volver a ponerlos es importar el organismo, pedir los casos al CMS
          en el Promise.all de arriba y montarlo aqui con `spacingStart="none"`. */}

      {/* El equipo se fue a /nosotros y las preguntas, a las paginas de servicio con su
          FAQPage en JSON-LD (reunion con Pigmento, 2026-10-22). Las de la home no se
          marcan aqui sin verse: el marcado tiene que describir contenido visible. */}

      {/* La ultima llamada, pegada al pie. La placa se despega de la pagina con el rol
          invertido: oscura sobre claro y clara sobre oscuro — lo que la hace placa es
          el contraste, no un color fijo. */}
{/* La strip entera negra en los dos modos (decision de Karen, 2026-10-26); la
          placa de dentro no se toca. */}
      <Section
        width="strip"
        spacing="loose"
        theme={{ light: "dark", dark: "dark" }}
        labelledBy={CTA_TITLE_ID}
      >
        <FinalCta {...getFinalCta(tCta, locale)} titleId={CTA_TITLE_ID} highlightFamily="tangerine" onSubmit={sendContact} />
      </Section>

    </main>
  );
}
