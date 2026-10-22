import type { Metadata } from "next";
import { ServicePage, serviceMetadata } from "@/app/service-page";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/servicios/motion">): Promise<Metadata> {
  return serviceMetadata(await params, "motion");
}

export default async function Motion({ params }: PageProps<"/[locale]/servicios/motion">) {
  const { locale } = await params;
  return <ServicePage locale={locale} service="motion" />;
}
