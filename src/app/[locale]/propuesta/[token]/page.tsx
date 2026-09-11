import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Section } from "@/design-system/components/layout/Section/Section";
import { ProposalAddOns } from "@/design-system/components/organisms/ProposalAddOns/ProposalAddOns";
import { ProposalAudit } from "@/design-system/components/organisms/ProposalAudit/ProposalAudit";
import { ProposalBaseline } from "@/design-system/components/organisms/ProposalBaseline/ProposalBaseline";
import { ProposalCover } from "@/design-system/components/organisms/ProposalCover/ProposalCover";
import { ProposalDiagnosis } from "@/design-system/components/organisms/ProposalDiagnosis/ProposalDiagnosis";
import { ProposalFigures } from "@/design-system/components/organisms/ProposalFigures/ProposalFigures";
import { ProposalRecommendation } from "@/design-system/components/organisms/ProposalRecommendation/ProposalRecommendation";
import { ProposalRoutes } from "@/design-system/components/organisms/ProposalRoutes/ProposalRoutes";
import { ProposalSheet } from "@/design-system/components/organisms/ProposalSheet/ProposalSheet";
import { formatPrice } from "@/design-system/components/molecules/PriceBand/PriceBand";
import { ProposalTerms } from "@/design-system/components/organisms/ProposalTerms/ProposalTerms";
import { getProposalByToken, type PriceUnit, type ProposalView } from "@/cms/proposals";
import { routing } from "@/i18n/routing";

/**
 * La cotizacion de UN cliente, en una URL que solo tiene quien la recibio.
 *
 * Tres decisiones de esta pagina son de seguridad y no de producto:
 *
 * - **404 y nunca 403.** Un 403 dice "ese token existe pero no es tuyo", y eso
 *   convierte la URL en un oraculo que se puede sondear. Token que no casa,
 *   propuesta que no existe: la misma respuesta que una ruta inventada.
 * - **`robots: index false`.** Un enlace que alguien pegue en un chat indexable
 *   basta para que la cotizacion acabe en un buscador. Va aqui y lo vigila el
 *   gate `proposals-noindex`.
 * - **Sin `generateStaticParams`.** Prerenderizar esto significaria escribir cada
 *   cotizacion en el build y servirla desde la CDN, donde ya no la protege ningun
 *   token.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/**
 * Hoy esta ruta ya sale como dinamica —no tiene `generateStaticParams` ni ninguna
 * llamada cacheada— y las respuestas viajan con `Cache-Control: private, no-store`.
 * Se declara igualmente porque esa proteccion es ACCIDENTAL: el dia que alguien
 * envuelva la consulta en `unstable_cache` "para que vaya mas rapido", la pagina
 * se vuelve cacheable sin que nada avise y una cotizacion se le sirve a otro.
 */
export const dynamic = "force-dynamic";

/** La vigencia se escribe en el idioma de la pagina, no en ISO: la lee un cliente. */
const FECHA: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" };

/**
 * El ancho del documento entero, en un solo sitio. Ninguna seccion lo decide por su
 * cuenta y ningun organismo trae el suyo: dos topes distintos —el del contenedor y
 * el del bloque— desalinean el texto contra la tabla, que es justo lo que se veia.
 */
const ANCHO = "wide" as const;

/**
 * El ritmo vertical del documento, y es lo unico que lo agrupa.
 *
 * Ocho franjas con el mismo hueco entre todas no son ocho ideas: son un muro. La
 * propuesta tiene TRES movimientos —el problema, la solucion, la decision— y aqui se
 * dicen con el unico recurso que no pinta nada: quien ABRE un movimiento se separa
 * con `loose`, quien lo CONTINUA con `default`.
 *
 * No se hace invirtiendo la zona de tema. El rol 'alt' de Section es la zona
 * contraria, no un escalon del mismo cluster: marcaria el bloque a base de darle la
 * vuelta al documento entero, que es mas ruido, no menos.
 */
const ABRE = "loose" as const;
const SIGUE = "default" as const;

/** Ata cada <section> con su titular: un landmark sin nombre no se navega. */
const IDS = {
  cover: "propuesta",
  diagnosis: "diagnostico",
  audit: "auditoria",
  figures: "mercado",
  baseline: "base",
  included: "base-incluido",
  routes: "rutas",
  addOns: "modulos",
  recommendation: "recomendacion",
  terms: "terminos",
} as const;

export default async function ProposalPage({ params }: PageProps<"/[locale]/propuesta/[token]">) {
  const { locale, token } = await params;

  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const proposal = await getProposalByToken(token);

  // Ni el token equivocado ni el borrador salen. Una propuesta en 'borrador' aun
  // no se ha enviado: que su URL respondiera dejaria ver precios a medio pensar.
  if (!proposal || proposal.status === "borrador") notFound();

  const t = await getTranslations("proposal");
  const intlLocale = `${locale}-MX`;

  const fecha = (iso: string) => new Intl.DateTimeFormat(intlLocale, FECHA).format(new Date(iso));

  const UNIDAD: Record<PriceUnit, string> = {
    proyecto: t("unitProyecto"),
    mes: t("unitMes"),
    pieza: t("unitPieza"),
  };
  const unitLabel = (unit: PriceUnit) => `${proposal.currency} · ${UNIDAD[unit]}`;

  /**
   * **La plantilla la eligen los DATOS, no un campo de tipo.** Con paquetes se
   * renderiza el documento comparativo; sin ellos, la hoja simple de una sola ruta.
   * Un campo "tipo" se desincroniza del contenido en cuanto alguien anade una ruta y
   * olvida cambiarlo; los datos no pueden mentir sobre si mismos.
   */
  return proposal.packages.length
    ? documento(proposal, { t, intlLocale, unitLabel, fecha, UNIDAD })
    : hoja(proposal, { t, intlLocale, fecha });
}

type Traducir = Awaited<ReturnType<typeof getTranslations<"proposal">>>;

function hoja(
  proposal: ProposalView,
  ctx: { t: Traducir; intlLocale: string; fecha: (iso: string) => string },
) {
  const { t, intlLocale, fecha } = ctx;

  return (
    <main>
      <Section width={ANCHO} spacing="loose" labelledBy={IDS.cover}>
        <ProposalSheet
          client={proposal.client}
          titleId={IDS.cover}
          title={t("title")}
          items={proposal.items}
          totalCents={proposal.totalCents}
          currency={proposal.currency}
          locale={intlLocale}
          conceptLabel={t("concept")}
          amountLabel={t("amount")}
          totalLabel={t("total")}
          validUntil={proposal.validUntil ? fecha(proposal.validUntil) : null}
          validUntilLabel={t("validUntil")}
          expiredLabel={proposal.expired ? t("expired") : null}
        />
      </Section>
    </main>
  );
}

function documento(
  proposal: ProposalView,
  ctx: {
    t: Traducir;
    intlLocale: string;
    unitLabel: (unit: PriceUnit) => string;
    fecha: (iso: string) => string;
    UNIDAD: Record<PriceUnit, string>;
  },
) {
  const { t, intlLocale, unitLabel, fecha, UNIDAD } = ctx;

  return (
    <main>
      <Section width={ANCHO} spacing="compact" labelledBy={IDS.cover}>
        <ProposalCover
          client={proposal.client}
          serviceTitle={proposal.serviceTitle ?? t("title")}
          tagline={proposal.tagline}
          image={proposal.cover}
          titleId={IDS.cover}
        />
      </Section>

      {proposal.headline ? (
        <Section width={ANCHO} spacing={ABRE} labelledBy={IDS.diagnosis}>
          <ProposalDiagnosis
            headline={proposal.headline}
            context={proposal.context ? [proposal.context] : []}
            titleId={IDS.diagnosis}
          />
        </Section>
      ) : null}

      {proposal.findings.length ? (
        <Section width={ANCHO} spacing={SIGUE} labelledBy={IDS.audit}>
          <ProposalAudit
            title={t("auditTitle")}
            titleId={IDS.audit}
            proof={t("auditProof")}
            costLabel={t("auditCost")}
            findings={proposal.findings}
          />
        </Section>
      ) : null}

      {proposal.figures.length ? (
        <Section width={ANCHO} spacing={SIGUE} labelledBy={IDS.figures}>
          <ProposalFigures
            title={t("figuresTitle")}
            titleId={IDS.figures}
            sourceLabel={t("source")}
            figures={proposal.figures}
          />
        </Section>
      ) : null}

      {proposal.deliverables.length ? (
        <Section width={ANCHO} spacing={ABRE} labelledBy={IDS.baseline}>
          <ProposalBaseline
            title={proposal.baseTitle ?? ""}
            titleId={IDS.baseline}
            deliverables={proposal.deliverables.map((d) => ({
              term: d.name,
              description: d.description,
            }))}
            includedInAll={proposal.includedInAll}
            includedTitle={t("includedTitle")}
            includedTitleId={IDS.included}
            includedLabel={t("included")}
            excludedLabel={t("excluded")}
          />
        </Section>
      ) : null}

      <Section width={ANCHO} spacing={SIGUE} labelledBy={IDS.routes}>
        <ProposalRoutes
          eyebrow={proposal.routesEyebrow ?? ""}
          title={t("routesTitle")}
          titleId={IDS.routes}
          currency={proposal.currency}
          locale={intlLocale}
          routes={proposal.packages.map((p) => ({
            key: p.name,
            name: p.name,
            accent: p.accent,
            kind: p.price.kind,
            amountCents: p.price.amountCents,
            amountMaxCents: p.price.amountMaxCents,
            unitLabel: unitLabel(p.price.unit),
            deliveryLabel:
              p.deliveryWeeks === null ? null : t("delivery", { weeks: p.deliveryWeeks }),
            body: p.body,
            recommended: p.recommended,
          }))}
          criteria={proposal.criteria}
          values={proposal.criteria.map((c) => ({
            criterion: c.label,
            cells: proposal.packages.map((p) => ({
              key: p.name,
              value: p.values.find((v) => v.key === c.key)?.value ?? "",
            })),
          }))}
          comparisonCaption={t("comparison")}
          criterionLabel={t("criterion")}
          emptyLabel={t("empty")}
          scrollLabel={t("scroll")}
          recommendedLabel={t("recommended")}
        />
      </Section>

      {proposal.addOns.length ? (
        <Section width={ANCHO} spacing={SIGUE} labelledBy={IDS.addOns}>
          <ProposalAddOns
            title={proposal.addOnsTitle ?? t("addOnsTitle")}
            titleId={IDS.addOns}
            intro={proposal.addOnsIntro}
            items={proposal.addOns.map((a) => ({
              term: a.name,
              description: a.description,
              aside: `${formatPrice(
                {
                  kind: a.price.kind,
                  amountCents: a.price.amountCents,
                  amountMaxCents: a.price.amountMaxCents,
                },
                proposal.currency,
                intlLocale,
              )} · ${UNIDAD[a.price.unit]}`,
            }))}
          />
        </Section>
      ) : null}

      {proposal.recHeadline ? (
        <Section width={ANCHO} spacing={ABRE} labelledBy={IDS.recommendation}>
          <ProposalRecommendation
            eyebrow={t("recommendationEyebrow")}
            headline={proposal.recHeadline}
            titleId={IDS.recommendation}
            body={proposal.recBody ? [proposal.recBody] : []}
            technicalNote={proposal.technicalNote}
          />
        </Section>
      ) : null}

      {proposal.terms.length ? (
        <Section width={ANCHO} spacing={SIGUE} labelledBy={IDS.terms}>
          <ProposalTerms
            title={proposal.termsTitle ?? ""}
            titleId={IDS.terms}
            terms={proposal.terms.map((term) => ({
              term: term.label,
              description: term.value,
            }))}
            closing={
              proposal.expired
                ? t("expired")
                : (proposal.closing ??
                  (proposal.validUntil ? `${t("validUntil")} ${fecha(proposal.validUntil)}` : null))
            }
          />
        </Section>
      ) : null}
    </main>
  );
}
