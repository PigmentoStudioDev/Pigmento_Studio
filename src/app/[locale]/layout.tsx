import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ProgressiveBlur } from "@/design-system/components/atoms/ProgressiveBlur/ProgressiveBlur";
import { SmoothScroll } from "@/design-system/components/layout/SmoothScroll/SmoothScroll";
import { SiteFooter } from "@/design-system/components/organisms/SiteFooter/SiteFooter";
import { SiteHeader } from "@/design-system/components/organisms/SiteHeader/SiteHeader";
import { themeModeScript } from "@/design-system/theme/mode";
import { routing } from "@/i18n/routing";
import { getFooter } from "../footer";
import { getNavigation } from "../navigation";
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
    { path: "../fonts/BirkenNue-Thin.woff2", weight: "100", style: "normal" },
    { path: "../fonts/BirkenNue-ExtraLight.woff2", weight: "200", style: "normal" },
    { path: "../fonts/BirkenNue-Light.woff2", weight: "300", style: "normal" },
    { path: "../fonts/BirkenNue-Regular.woff2", weight: "400", style: "normal" },
    { path: "../fonts/BirkenNue-Medium.woff2", weight: "500", style: "normal" },
    { path: "../fonts/BirkenNue-SemiBold.woff2", weight: "600", style: "normal" },
    { path: "../fonts/BirkenNue-Bold.woff2", weight: "700", style: "normal" },
    { path: "../fonts/BirkenNue-ExtraBold.woff2", weight: "800", style: "normal" },
    { path: "../fonts/BirkenNue-Heavy.woff2", weight: "900", style: "normal" },
  ],
});

// Mono y serif siguen siendo Plex. El mono ya no es solo cosa de /ds: es la familia
// de las etiquetas y de los controles, o sea la mitad de la senal tipografica del
// sitio — mono para lo que es metadato o accion, la sans para el contenido.
//
// El 500 lo pide esa escala, y sin declararlo el navegador sintetiza un peso falso
// estirando el 400: mas gordo y sin el dibujo que la fundicion hizo para ese peso.
// El 400 se queda porque lo usan los tokens de codigo de Carbon.
//
// El serif solo aparece en tokens de Carbon (quotation-01/02, fluid-paragraph-01).
// TODO(brand): decidir si Pigmento quiere un mono propio, que ahora si se ve.
const mono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
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

/**
 * Las dos versiones se prerenderizan. Sin esto, cada ruta con idioma se volveria
 * dinamica: `setRequestLocale` cuenta como lectura de cabeceras salvo que el
 * segmento este entre los generados de antemano.
 */
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function RootLayout({
  children,
  params,
}: LayoutProps<"/[locale]">) {
  const { locale } = await params;

  // El segmento es entrada de fuera: `/xx/` es una URL que cualquiera puede
  // escribir. Sin esta comprobacion, next-intl caeria al idioma por defecto y el
  // sitio contestaria 200 a una direccion que no existe.
  if (!hasLocale(routing.locales, locale)) notFound();

  setRequestLocale(locale);

  const t = await getTranslations("nav");
  const tFooter = await getTranslations("footer");

  return (
    <html
      lang={locale}
      className={`${sans.variable} ${mono.variable} ${serif.variable}`}
      // El script de abajo anade la clase de modo ANTES de que React hidrate, asi
      // que el className del cliente nunca puede coincidir con el del servidor: el
      // servidor no sabe la preferencia. La diferencia no es un fallo, es el
      // mecanismo, y React necesita que se lo digan o la reporta como hidratacion
      // rota. Solo silencia este elemento y solo un nivel: lo de dentro se sigue
      // comprobando entero.
      suppressHydrationWarning
    >
      <head>
        {/* La clase de modo la pone este script, no el servidor, porque el
            servidor no puede saberla: la preferencia vive en el navegador. Corre
            sincrono y antes de la primera pintura, que es la unica forma de que
            quien eligio oscuro no vea un fotograma en claro.

            dangerouslySetInnerHTML es como se inyecta un script inline en React y
            no hay entrada de nadie aqui: el contenido es una constante del design
            system, sin un solo dato de fuera. */}
        {/* La valvula va en la MISMA linea que la violacion — el runner descarta la
            linea que la lleva, no el bloque — y PEGADA a la etiqueta, sin espacio:
            un espacio entre dos elementos JSX en la misma linea es un nodo de texto,
            y un nodo de texto dentro de <head> es HTML invalido que React reporta
            como error de hidratacion. El motivo, entero, es que el contenido
            es una constante del design system construida en themeModeScript() sin
            un solo dato de entrada — ni props, ni URL, ni CMS — y que inyectarlo
            inline es la unica forma de correr algo antes de la primera pintura,
            que es el requisito completo de esta linea. */}
        <script dangerouslySetInnerHTML={{ __html: themeModeScript() }} />{/* conformance-exempt: constante del DS sin datos de entrada, ver arriba */}
      </head>
      <body>
        {/* Solo el proveedor de cliente, sin volcar los diccionarios enteros: lo
            que necesita el navegador son las cadenas de los componentes de
            cliente, y mandarle el resto es peso que nadie lee. */}
        <NextIntlClientProvider>
          {/* No pinta nada: cambia como se desplaza la pagina entera. Va antes que
              todo lo demas para que el scroll ya este suavizado cuando el primer
              bloque se registre a el. */}
          <SmoothScroll />
          {/* Antes que la cabecera: difumina lo que pasa por DEBAJO de la barra
              conforme se acerca al borde, para que la barra pueda ir sin fondo
              propio sobre un hero de video. Detras de ella tambien por z-index
              (90 contra 100) — encima la difuminaria a ella. */}
          <ProgressiveBlur />
          <SiteHeader {...getNavigation(t)} />
          {children}
          {/* Chrome de pagina, como la cabecera: va aqui y no envuelto en un
              Section. Un <footer> dentro de <section> deja de ser el landmark
              contentinfo — la regla de HTML es que solo lo es cuando no esta
              anidado — y ademas el pie no es un bloque que el CMS vaya a colocar
              entre otros, asi que no tiene ritmo vertical que heredar. */}
          <SiteFooter {...getFooter(tFooter)} />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
