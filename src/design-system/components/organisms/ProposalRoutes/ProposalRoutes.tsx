import { Heading } from "../../atoms/Heading/Heading";
import { SectionChip } from "../../atoms/SectionChip/SectionChip";
import { Tag } from "../../atoms/Tag/Tag";
import { ScrollReveal } from "../../layout/ScrollReveal/ScrollReveal";
import { ComparisonTable } from "../../molecules/ComparisonTable/ComparisonTable";
import { PriceBand, type PriceAccent, type PriceKind } from "../../molecules/PriceBand/PriceBand";
import styles from "./ProposalRoutes.module.scss";

export interface ProposalRoute {
  key: string;
  name: string;
  accent: PriceAccent;
  kind: PriceKind;
  amountCents: number;
  amountMaxCents?: number | null;
  /** "MXN / proyecto" — ya compuesto por la pagina, que sabe el idioma. */
  unitLabel: string;
  /** "Entrega estimada: 3 semanas", o null si no se prometio. */
  deliveryLabel?: string | null;
  body: string[];
  recommended?: boolean;
}

export interface ProposalRoutesProps {
  eyebrow: string;
  /** El titular de la seccion, no de cada ruta. */
  title: string;
  currency: string;
  locale: string;
  routes: ProposalRoute[];
  /** La matriz. Vacia si la propuesta no declaro criterios. */
  criteria: { key: string; label: string }[];
  values: { criterion: string; cells: { key: string; value: string }[] }[];
  comparisonCaption: string;
  criterionLabel: string;
  emptyLabel: string;
  scrollLabel: string;
  /** Se anade al nombre de la ruta recomendada, para que no sea solo un color. */
  recommendedLabel: string;
  titleId?: string;
}

/**
 * Las rutas y en que se diferencian.
 *
 * Cada ruta se presenta entera —nombre, precio y por que existe— y **despues** viene
 * la matriz. El orden importa: la comparativa solo significa algo cuando ya se sabe
 * que se esta comparando, y una tabla puesta primero obliga a subir y bajar.
 *
 * La recomendada lleva ETIQUETA ademas de su tinte. Si la unica senal fuera el color,
 * quien no lo distinga —o quien imprima la pagina en gris— no tendria forma de saber
 * cual recomienda el estudio.
 */
export function ProposalRoutes({
  eyebrow,
  title,
  currency,
  locale,
  routes,
  criteria,
  values,
  comparisonCaption,
  criterionLabel,
  emptyLabel,
  scrollLabel,
  recommendedLabel,
  titleId,
}: ProposalRoutesProps) {
  return (
    <div className={styles.root}>
      <ScrollReveal by="block" inner>
        <div className={styles.header}>
          <SectionChip>{eyebrow}</SectionChip>
          <Heading level={2} id={titleId}>
            {title}
          </Heading>
        </div>
      </ScrollReveal>

      {/* `inner`: entra una ruta detras de otra. Las tarjetas van como CAJA y no
          partidas por lineas — dentro hay una banda de precio y una pildora, y el
          gesto de lineas solo tiene sentido sobre texto corrido. */}
      <ScrollReveal by="block" inner>
        <ul className={styles.routes}>
        {routes.map((route) => (
          <li className={styles.route} key={route.key}>
            <div className={styles.routeHead}>
              <Heading level={3}>{route.name}</Heading>
              {/* Un `Tag` y no una pildora propia: el atomo ya existe, y la
                  pildora es de los CONTROLES — rodarme la mia hizo saltar el gate
                  de radios, que es exactamente para lo que esta. */}
              {route.recommended ? <Tag tone="info">{recommendedLabel}</Tag> : null}
            </div>

            <PriceBand
              kind={route.kind}
              amountCents={route.amountCents}
              amountMaxCents={route.amountMaxCents}
              currency={currency}
              locale={locale}
              unitLabel={route.unitLabel}
              deliveryLabel={route.deliveryLabel}
              accent={route.accent}
            />

            {route.body.map((paragraph) => (
              <p className={styles.paragraph} key={paragraph}>
                {paragraph}
              </p>
            ))}
          </li>
          ))}
        </ul>
      </ScrollReveal>

      {criteria.length ? (
        <ScrollReveal by="block">
          <ComparisonTable
            caption={comparisonCaption}
            criterionLabel={criterionLabel}
            columns={routes.map((route) => ({
              key: route.key,
              name: route.name,
              meta: route.unitLabel,
            }))}
            rows={values.map((row) => ({ criterion: row.criterion, values: row.cells }))}
            emptyLabel={emptyLabel}
            scrollLabel={scrollLabel}
          />
        </ScrollReveal>
      ) : null}
    </div>
  );
}
