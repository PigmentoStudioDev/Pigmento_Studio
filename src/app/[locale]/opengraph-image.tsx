import { ImageResponse } from "next/og";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import type { CSSProperties } from "react";
import { routing } from "@/i18n/routing";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Los dos idiomas se generan en el build; sin esto la imagen se calcularia por peticion.
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

// ImageResponse solo entiende estilos en linea: no hay hoja de estilos ni tokens que resolver
// al renderizar a PNG, asi que los valores van fijos aqui y no en el sistema de diseno.
const CARD: CSSProperties = {
  width: "100%",
  height: "100%",
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  padding: 80,
  background: "#0b0b0c",
  color: "#f4f4f4",
};
const NAME: CSSProperties = { fontSize: 88, fontWeight: 700, letterSpacing: -2 };
const TAGLINE: CSSProperties = { fontSize: 36, lineHeight: 1.35, maxWidth: 900, color: "#c6c6c6" };

/**
 * La tarjeta social por defecto de todo el sitio: el nombre y la frase del estudio, los
 * mismos textos del pie para no mantener una tercera copia. Fuente por defecto de
 * ImageResponse: la de marca es woff2 y ImageResponse solo admite ttf, otf y woff.
 */
export default async function Image({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const resolved = hasLocale(routing.locales, locale) ? locale : routing.defaultLocale;
  const t = await getTranslations({ locale: resolved, namespace: "footer" });

  return new ImageResponse(
    (
      <div style={CARD}>
        <div style={NAME}>{t("studio")}</div>
        <div style={TAGLINE}>{t("tagline")}</div>
      </div>
    ),
    size,
  );
}
