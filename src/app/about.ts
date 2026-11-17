import type { ServicesListItem } from "@/design-system/components/organisms/ServicesList/ServicesList";

type Translate = (key: string) => string;

const SERVICE_KEYS = ["branding", "web", "motion", "marketing"] as const;

export function getServicesList(tServices: Translate): ServicesListItem[] {
  return SERVICE_KEYS.map((key) => ({
    name: tServices(`items.${key}.name`),
    text: tServices(`items.${key}.text`),
  }));
}
