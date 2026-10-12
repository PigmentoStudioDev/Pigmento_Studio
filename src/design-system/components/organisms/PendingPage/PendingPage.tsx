import { Button } from "../../atoms/Button/Button";
import { Heading } from "../../atoms/Heading/Heading";
import { Subheading } from "../../atoms/Subheading/Subheading";

/**
 * Una pagina que existe y todavia no esta escrita.
 *
 * **No es decoracion: es la unica forma de que la home no mienta.** La barra, el pie y
 * la llamada final apuntan a siete rutas —trabajo, servicios, nosotros, contacto y tres
 * servicios— que no estaban construidas, asi que cada enlace de la pagina publicada
 * daba 404. Medido en produccion: la home respondia 200 y las siete, 404. Un 404 desde
 * un enlace propio no se lee como "esto viene luego", se lee como un sitio roto.
 *
 * Es la MISMA pieza que `not-found.tsx` —`pg-status` con titular, subtitulo y una
 * salida— y eso es deliberado: una pagina de estado no es un hero, y las dos son
 * estados. La diferencia esta en el texto y en que esta si se puede visitar a
 * proposito.
 *
 * **Lo que hace el trabajo de verdad no se ve, y va en la ruta: `robots.index: false`.**
 * Siete paginas casi vacias indexadas son peor problema que siete 404 — un 404 le dice
 * al buscador que no hay nada y lo saca del indice; una pagina de cortesia le dice que
 * si hay algo, y lo que acaba en los resultados con el nombre del estudio es esto. Por
 * eso vive en `app/pending.ts` junto al texto: el componente no puede declarar
 * metadata, y separarlos deja la mitad de la decision sin su motivo al lado.
 *
 * Lleva `<main>` propio porque el layout no pone ninguno, igual que `not-found.tsx`.
 *
 * Server component y props planas: cuando una de estas rutas se escriba de verdad, lo
 * unico que hay que hacer es borrar su llamada a este componente.
 */
export interface PendingPageProps {
  /** El nombre de la pagina, el mismo que lleva el enlace que trae aqui. */
  title: string;
  /** Una linea: que va a haber aqui y que hacer mientras. */
  intro: string;
  /** La salida. Siempre hay una: una pagina sin salida es un callejon. */
  actionLabel: string;
  actionHref: string;
}

export function PendingPage({ title, intro, actionLabel, actionHref }: PendingPageProps) {
  return (
    <main className="pg-status">
      {/* level 1 y cuerpo pequeno, como en not-found: es el titulo del documento, pero
          una pagina de estado no es un hero. Es justo el caso para el que el titular
          separa el nivel del tamano. */}
      <Heading level={1} size="lead">
        {title}
      </Heading>

      <Subheading>{intro}</Subheading>

      <Button href={actionHref}>{actionLabel}</Button>
    </main>
  );
}
