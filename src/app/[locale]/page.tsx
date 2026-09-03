import { getTranslations, setRequestLocale } from "next-intl/server";
import { Section } from "@/design-system/components/layout/Section/Section";
import { Faq } from "@/design-system/components/organisms/Faq/Faq";
import { FinalCta } from "@/design-system/components/organisms/FinalCta/FinalCta";
import { Manifesto } from "@/design-system/components/organisms/Manifesto/Manifesto";
import { Team } from "@/design-system/components/organisms/Team/Team";
import { HeroVideo } from "@/design-system/components/organisms/HeroVideo/HeroVideo";
import { Marquee } from "@/design-system/components/molecules/Marquee/Marquee";
import { getFinalCta } from "../cta";
import { getFaq } from "../faq";
import { getManifesto } from "../manifesto";
import { getTeam } from "../team";

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
const TEAM_TITLE_ID = "equipo";
const FAQ_TITLE_ID = "faq";
const CTA_TITLE_ID = "contacto";

export default async function Home({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;

  // Sin esto la ruta se vuelve dinamica: leer traducciones cuenta como leer cabeceras
  // salvo que el segmento este entre los generados de antemano.
  setRequestLocale(locale);

  const t = await getTranslations("home.manifesto");
  const tTeam = await getTranslations("home.team");
  const tFaq = await getTranslations("home.faq");
  const tCta = await getTranslations("home.cta");

  return (
    <main>
      <Section width="full" spacing="none">
        <HeroVideo
          eyebrow="Estudio de marca"
          title="Pigmento Studio"
          videoSrc="https://pub-689bd7bf1ef94ab08b150945eac861e5.r2.dev/hero-glitch-1080p.mp4"
          videoPoster="/hero-glitch-poster.webp"
          ctaLabel="Ver el trabajo"
          ctaHref="/trabajo"
        />
      </Section>

      {/* Debajo del hero, y a sangre: una tira que se cortara contra un contenedor
          dejaria de leerse como una cinta continua. `base` y no `alt`: un rol alt es
          la zona INVERTIDA — fondo oscuro en modo claro — y la tira tiene que seguir
          al modo, no contradecirlo. */}
      <Section width="full" spacing="none">
        <Marquee
          kind="logos"
          theme="base"
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
        <Manifesto {...getManifesto(t)} />
      </Section>

      {/* Quien hace el trabajo, antes de las objeciones: la primera pregunta de
          cualquiera que va a contratar un estudio pequeno es con quien va a hablar. */}
      <Section width="full" spacing="loose" labelledBy={TEAM_TITLE_ID}>
        <Team {...getTeam(tTeam)} titleId={TEAM_TITLE_ID} />
      </Section>

      {/* Las objeciones, al final: quien llega hasta aqui ya sabe que hacemos y
          esta decidiendo, no explorando. A sangre porque la lista se escanea de un
          borde al otro. `labelledBy` convierte el <section> en un landmark con
          nombre, y quien pone ese nombre es el titular del bloque. */}
      <Section width="full" spacing="loose" labelledBy={FAQ_TITLE_ID}>
        <Faq {...getFaq(tFaq)} titleId={FAQ_TITLE_ID} />
      </Section>

      {/* La ultima llamada, pegada al pie. La placa se despega de la pagina con el rol
          invertido: oscura sobre claro y clara sobre oscuro — lo que la hace placa es
          el contraste, no un color fijo. */}
      <Section width="full" spacing="loose" labelledBy={CTA_TITLE_ID}>
        <FinalCta {...getFinalCta(tCta)} titleId={CTA_TITLE_ID} />
      </Section>

    </main>
  );
}
