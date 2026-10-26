import type { FinalCtaProps } from "@/design-system/components/organisms/FinalCta/FinalCta";
import type { ContactErrorCode } from "@/design-system/components/molecules/ContactForm/validate";

/**
 * La llamada final. Vive en app/ y no en el design system por lo mismo que el resto
 * del contenido: el contrato de modularidad exige que el DS pueda salir de este repo
 * sin arrastrar sus rutas.
 */
interface Translate {
  (key: string): string;
  /** El mensaje sin formatear, con sus llaves. */
  raw(key: string): unknown;
}

/**
 * Los temas son los servicios del sitio mas un "otro": quien escribe sin saber en que
 * casilla cae no deberia tener que elegir una que no es la suya. El valor viaja en
 * el mensaje y no se traduce, para que quien lo lea lo agrupe igual en los dos idiomas.
 */
const TOPICS = ["branding", "web", "motion", "marketing", "other"] as const;

const ERRORS: readonly ContactErrorCode[] = [
  "nameRequired",
  "emailRequired",
  "emailInvalid",
  "phoneInvalid",
  "messageRequired",
  "messageShort",
];

export function getFinalCta(t: Translate, locale: string): Omit<FinalCtaProps, "onSubmit"> {
  const f = (key: string) => t(`form.${key}`);

  return {
    label: t("label"),
    title: t("title"),
    intro: t("intro"),
    titleHighlight: t("titleHighlight"),
    form: {
      locale,
      topics: TOPICS.map((value) => ({ value, label: f(`topics.${value}`) })),
      copy: {
        formLabel: f("formLabel"),
        name: f("name"),
        namePlaceholder: f("namePlaceholder"),
        email: f("email"),
        emailPlaceholder: f("emailPlaceholder"),
        phone: {
          label: f("phone.label"),
          country: String(t.raw("form.phone.country")),
          search: f("phone.search"),
          searchPlaceholder: f("phone.searchPlaceholder"),
          clearSearch: f("phone.clearSearch"),
          suggested: f("phone.suggested"),
          allCountries: f("phone.allCountries"),
          noMatches: String(t.raw("form.phone.noMatches")),
          results: String(t.raw("form.phone.results")),
          valid: String(t.raw("form.phone.valid")),
        },
        topic: f("topic"),
        message: f("message"),
        messagePlaceholder: f("messagePlaceholder"),
        // Las llaves se pasan tal cual: el numero y el nombre los pone el formulario
        // al escribir, y next-intl se quejaria de una variable que nadie le da.
        remaining: String(t.raw("form.remaining")),
        submit: f("submit"),
        sending: f("sending"),
        failure: f("failure"),
        successTitle: String(t.raw("form.successTitle")),
        successText: f("successText"),
        again: f("again"),
        errors: Object.fromEntries(ERRORS.map((code) => [code, f(`errors.${code}`)])) as Record<
          ContactErrorCode,
          string
        >,
      },
    },
  };
}
