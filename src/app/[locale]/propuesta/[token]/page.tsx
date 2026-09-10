import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Section } from "@/design-system/components/layout/Section/Section";
import { ProposalSheet } from "@/design-system/components/organisms/ProposalSheet/ProposalSheet";
import { getProposalByToken } from "@/cms/proposals";
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
 *   gate `proposals-noindex`, porque es una linea que se cae en un refactor y
 *   nadie la echa de menos hasta que aparece en Google.
 * - **Sin `generateStaticParams`.** Prerenderizar esto significaria escribir cada
 *   cotizacion en el build y servirla desde la CDN. Se renderiza a peticion.
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
export const dynamic = 'force-dynamic';

/** La vigencia se escribe en el idioma de la pagina, no en ISO: la lee un cliente. */
const FECHA: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" };

/** Ata el <section> con el titular de la hoja: un landmark sin nombre no se navega. */
const TITLE_ID = "propuesta";

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

  return (
    <main>
      <Section spacing="loose" labelledBy={TITLE_ID}>
        <ProposalSheet
          client={proposal.client}
          titleId={TITLE_ID}
          title={t("title")}
          items={proposal.items}
          totalCents={proposal.totalCents}
          currency={proposal.currency}
          locale={intlLocale}
          conceptLabel={t("concept")}
          amountLabel={t("amount")}
          totalLabel={t("total")}
          validUntil={
            proposal.validUntil
              ? new Intl.DateTimeFormat(intlLocale, FECHA).format(new Date(proposal.validUntil))
              : null
          }
          validUntilLabel={t("validUntil")}
          expiredLabel={proposal.expired ? t("expired") : null}
        />
      </Section>
    </main>
  );
}
