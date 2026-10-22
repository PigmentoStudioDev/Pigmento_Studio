import type { Metadata } from "next";
import { ServicePage, serviceMetadata } from "@/app/service-page";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/servicios/branding">): Promise<Metadata> {
  return serviceMetadata(await params, "branding");
}

export default async function Branding({ params }: PageProps<"/[locale]/servicios/branding">) {
  const { locale } = await params;
  return <ServicePage locale={locale} service="branding" />;
}
