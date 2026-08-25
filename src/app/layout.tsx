import type { Metadata } from "next";
import { SiteHeader } from "@/design-system/components/organisms/SiteHeader/SiteHeader";
import { NAVIGATION } from "./navigation";
import { IBM_Plex_Mono, IBM_Plex_Serif } from "next/font/google";
import localFont from "next/font/local";
import "@/design-system/styles/index.scss";

// Carbon consume estas variables a traves de $font-families en
// src/design-system/styles/_carbon-config.scss. Si cambias un nombre, cambialo alli.

/**
 * La sans de Pigmento. Se declaran los NUEVE pesos, y no cuesta lo que parece:
 * next/font emite un @font-face por peso, y el navegador solo descarga los que
 * algun texto renderizado usa de verdad. Declarar no es descargar — recortar la
 * lista solo quitaria opciones al diseno sin ahorrar un byte a quien visita.
 *
 * Los 167kb del repo si son reales, pero son del deploy, no de la carga.
 */
const sans = localFont({
  variable: "--font-sans",
  display: "swap",
  src: [
    { path: "./fonts/BirkenNue-Thin.woff2", weight: "100", style: "normal" },
    { path: "./fonts/BirkenNue-ExtraLight.woff2", weight: "200", style: "normal" },
    { path: "./fonts/BirkenNue-Light.woff2", weight: "300", style: "normal" },
    { path: "./fonts/BirkenNue-Regular.woff2", weight: "400", style: "normal" },
    { path: "./fonts/BirkenNue-Medium.woff2", weight: "500", style: "normal" },
    { path: "./fonts/BirkenNue-SemiBold.woff2", weight: "600", style: "normal" },
    { path: "./fonts/BirkenNue-Bold.woff2", weight: "700", style: "normal" },
    { path: "./fonts/BirkenNue-ExtraBold.woff2", weight: "800", style: "normal" },
    { path: "./fonts/BirkenNue-Heavy.woff2", weight: "900", style: "normal" },
  ],
});

// Mono y serif siguen siendo Plex: los usan tokens de Carbon que no son de la sans
// — code-01/02 el mono, quotation-01/02 y fluid-paragraph-01 el serif — y hoy solo
// aparecen en /ds. TODO(brand): decidir si Pigmento quiere las suyas.
const mono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400"],
});

const serif = IBM_Plex_Serif({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400"],
});

export const metadata: Metadata = {
  // Sin metadataBase, las URLs relativas de Open Graph no resuelven y las tarjetas
  // sociales salen sin imagen. En local apunta al dev server; en Vercel se define
  // NEXT_PUBLIC_SITE_URL.
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ),
  title: {
    default: "Pigmento Studio",
    template: "%s · Pigmento Studio",
  },
  description:
    "Estudio de diseño y crecimiento de marca en Santa Fe, Ciudad de México. Branding, marketing digital, programación web y motion graphics.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${sans.variable} ${mono.variable} ${serif.variable}`}
    >
      <body>
        <SiteHeader {...NAVIGATION} />
        {children}
      </body>
    </html>
  );
}
