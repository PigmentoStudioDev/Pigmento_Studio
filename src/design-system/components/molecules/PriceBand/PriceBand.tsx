import { NumberRoll } from "../NumberRoll/NumberRoll";
import styles from "./PriceBand.module.scss";

/** Las tres formas de precio que conviven en una propuesta de Pigmento. */
export type PriceKind = "fijo" | "mensual" | "rango";

/** El tinte de la ruta. Numerado, no nombrado por color: ver `_brand.scss`. */
export type PriceAccent = "uno" | "dos" | "tres";

export interface PriceBandProps {
  kind: PriceKind;
  /** En CENTAVOS enteros. Con `rango`, es el extremo bajo. */
  amountCents: number;
  /** El extremo alto del rango. Se ignora fuera de `kind: "rango"`. */
  amountMaxCents?: number | null;
  currency: string;
  /** BCP-47 para `Intl`. Lo decide la pagina, no la molecula. */
  locale: string;
  /** "MXN / PROYECTO", "MXN / MES", "MXN c/u" — lo compone quien sabe el idioma. */
  unitLabel: string;
  /** "Entrega estimada: 3 semanas". Los modulos adicionales no la llevan. */
  deliveryLabel?: string | null;
  accent: PriceAccent;
}

const ACCENT: Record<PriceAccent, string> = {
  uno: styles.accentUno,
  dos: styles.accentDos,
  tres: styles.accentTres,
};

/**
 * El dinero se formatea aqui y llega en centavos enteros: una cotizacion en coma
 * flotante deja de cuadrar al sumar y eso lo ve el cliente.
 *
 * Los centavos solo se pintan cuando existen. Un documento con `.00` en cada cifra
 * se lee como un ticket de compra, y el original de Pigmento escribe `$48,000`.
 */
function money(cents: number, currency: string, locale: string) {
  const exactos = cents % 100 === 0;

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: exactos ? 0 : 2,
    maximumFractionDigits: exactos ? 0 : 2,
  }).format(cents / 100);
}

/**
 * La banda de precio de una ruta o de un modulo adicional.
 *
 * **Es un componente de servidor y no lleva una sola linea de JS.** El precio de una
 * propuesta no cambia: se imprime una vez. Si algun dia una ruta tiene que rodar de
 * una cifra a otra —el caso real es el selector de ruta en movil, donde tres columnas
 * no caben— ese gesto envuelve a esta banda desde fuera y no entra aqui. Metiendolo
 * dentro, cada banda de la pagina de modulos se volveria cliente con GSAP detras, y
 * quien lo nota es `budgets`.
 */
export interface PriceShape {
  kind: PriceKind;
  amountCents: number;
  amountMaxCents?: number | null;
}

/**
 * El precio ya compuesto, rango incluido.
 *
 * Se exporta porque la pagina tambien lo necesita —los modulos adicionales llevan su
 * precio junto al concepto y no en una banda— y la primera version lo reescribio
 * alli: se comio el extremo alto de los rangos y `$200 - $350` salio como `$200`. Una
 * sola definicion, o vuelve a pasar.
 *
 * El guion es una RAYA y no un menos: entre dos cifras, el menos se lee como resta.
 * Con el extremo alto ausente, el rango degrada a cifra suelta en vez de dejar
 * "$200 –" colgando.
 */
export function formatPrice(
  { kind, amountCents, amountMaxCents }: PriceShape,
  currency: string,
  locale: string,
): string {
  const desde = money(amountCents, currency, locale);

  return kind === "rango" && typeof amountMaxCents === "number"
    ? `${desde} – ${money(amountMaxCents, currency, locale)}`
    : desde;
}

export function PriceBand({
  kind,
  amountCents,
  amountMaxCents,
  currency,
  locale,
  unitLabel,
  deliveryLabel,
  accent,
}: PriceBandProps) {
  const precio = formatPrice({ kind, amountCents, amountMaxCents }, currency, locale);

  return (
    <div className={[styles.root, ACCENT[accent]].join(" ")}>
      {/* El precio rueda al entrar en pantalla. La banda sigue siendo componente de
          SERVIDOR: lo que cruza al navegador es el rodado, y la cifra viaja formateada
          en el HTML — un precio que dependa de JS para leerse no es una opcion en un
          documento que existe para que alguien decida cuanto paga. */}
      <p className={styles.amount}>
        <NumberRoll value={precio} />
      </p>

      <div className={styles.meta}>
        <p className={styles.unit}>{unitLabel}</p>
        {deliveryLabel ? <p className={styles.delivery}>{deliveryLabel}</p> : null}
      </div>
    </div>
  );
}
