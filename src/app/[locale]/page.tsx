import Link from "next/link";
import { Section } from "@/design-system/components/layout/Section/Section";
import { HeroVideo } from "@/design-system/components/organisms/HeroVideo/HeroVideo";
import { Marquee } from "@/design-system/components/molecules/Marquee/Marquee";

/**
 * El hero va en la RUTA y no en `app/layout.tsx`: en el layout raiz saldria tambien
 * en /ds y en el 404. Es ademas lo que dice el contrato de modularidad — a un
 * organismo lo monta una ruta, porque un organismo es un bloque de pagina.
 *
 * El `Section` que lo envuelve es quien pone el ritmo: a sangre y sin padding
 * propio. El organismo no decide ni su hueco ni su tema, para que el dia que Payload
 * arme la pagina el espacio entre bloques dependa del orden y no de cuales sean.
 */
export default function Home() {
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
          dejaria de leerse como una cinta continua. `alt` la despega del fondo de la
          pagina — g10 en modo claro, g90 en oscuro, resuelto por el rol y no por un
          color fijo. */}
      <Section width="full" spacing="none">
        <Marquee
          kind="logos"
          theme="alt"
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

      <Section>
        <p>
          <Link href="/ds">Ver el preview del design system</Link>
        </p>
      </Section>
    </main>
  );
}
