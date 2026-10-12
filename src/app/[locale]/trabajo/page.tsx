import type { Metadata } from "next";
import { PendingPage } from "@/design-system/components/organisms/PendingPage/PendingPage";
import { pendingMetadata, pendingProps } from "@/app/pending";

/**
 * Trabajo: la ruta existe y la pagina todavia no esta escrita.
 *
 * Estaba enlazada desde la barra, el pie o la llamada final de la home y daba 404 en
 * produccion. Todo lo que comparte con las otras seis —el texto, la guarda de idioma y
 * el `noindex`— vive en `app/pending.ts`; aqui solo queda la clave.
 *
 * Para escribirla de verdad: se sustituye este cuerpo y se borra `work` de
 * `pending` en los dos diccionarios.
 */
export async function generateMetadata({
  params,
}: PageProps<"/[locale]/trabajo">): Promise<Metadata> {
  return pendingMetadata(await params, "work");
}

export default async function Trabajo({ params }: PageProps<"/[locale]/trabajo">) {
  return <PendingPage {...(await pendingProps(await params, "work"))} />;
}
