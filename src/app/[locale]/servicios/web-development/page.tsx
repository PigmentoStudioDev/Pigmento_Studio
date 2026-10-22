import type { Metadata } from "next";
import { ServicePage, serviceMetadata } from "@/app/service-page";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/servicios/web-development">): Promise<Metadata> {
  return serviceMetadata(await params, "web");
}

export default async function WebDevelopment({ params }: PageProps<"/[locale]/servicios/web-development">) {
  const { locale } = await params;
  return <ServicePage locale={locale} service="web" />;
}
