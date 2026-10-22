import type { Metadata } from "next";
import { ServicePage, serviceMetadata } from "@/app/service-page";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/servicios/marketing">): Promise<Metadata> {
  return serviceMetadata(await params, "marketing");
}

export default async function Marketing({ params }: PageProps<"/[locale]/servicios/marketing">) {
  const { locale } = await params;
  return <ServicePage locale={locale} service="marketing" />;
}
