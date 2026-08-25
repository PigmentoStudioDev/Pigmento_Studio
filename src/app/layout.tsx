import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans, IBM_Plex_Serif } from "next/font/google";
import "@/design-system/styles/index.scss";

// Carbon consume estas variables a traves de $font-families en
// src/design-system/styles/_carbon-config.scss. Si cambias un nombre, cambialo alli.
// Serif no es decorativo: Carbon lo usa en quotation-01/02 y fluid-paragraph-01.
const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["300", "400", "600"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400"],
});

const plexSerif = IBM_Plex_Serif({
  variable: "--font-plex-serif",
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
  description: "Estudio de diseno y desarrollo",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${plexSans.variable} ${plexMono.variable} ${plexSerif.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
