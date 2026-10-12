import type { Metadata } from "next";
import { PendingPage } from "@/design-system/components/organisms/PendingPage/PendingPage";
import { pendingMetadata, pendingProps } from "@/app/pending";

/**
 * Contacto: la ruta existe y la pagina todavia no esta escrita.
 *
 * Estaba enlazada desde la barra, el pie o la llamada final de la home y daba 404 en
 * produccion. Todo lo que comparte con las otras seis —el texto, la guarda de idioma y
 * el `noindex`— vive en `app/pending.ts`; aqui solo queda la clave.
 *
 * Para escribirla de verdad: se sustituye este cuerpo y se borra `contact` de
 * `pending` en los dos diccionarios.
 */
export async function generateMetadata({
  params,
}: PageProps<"/[locale]/contacto">): Promise<Metadata> {
  return pendingMetadata(await params, "contact");
}

export default async function Contacto({ params }: PageProps<"/[locale]/contacto">) {
  return <PendingPage {...(await pendingProps(await params, "contact"))} />;
}
