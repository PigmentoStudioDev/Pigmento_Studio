import type { ApproachItem } from "@/design-system/components/organisms/AboutApproach/AboutApproach";
import type { ServicesListItem } from "@/design-system/components/organisms/ServicesList/ServicesList";
import type { WorkProject } from "@/cms/projects";

type Translate = (key: string) => string;

/** Las decisiones de "Como lo hacemos" que cuentan el enfoque; la referencia pone tres. */
const APPROACH_KEYS = ["direct", "tested", "sameTable"] as const;

/**
 * El enfoque sale de los valores del sitio y las imagenes de las portadas del CMS, en su
 * orden: sin proyecto, la columna se queda sin imagen en vez de inventar una.
 */
export function getApproach(tValues: Translate, projects: WorkProject[]): ApproachItem[] {
  return APPROACH_KEYS.map((key, index) => ({
    title: tValues(`cards.${key}.title`),
    text: tValues(`cards.${key}.text`),
    ...(projects[index] ? { image: projects[index].image } : {}),
  }));
}

const SERVICE_KEYS = ["branding", "web", "motion", "marketing"] as const;

export function getServicesList(tServices: Translate): ServicesListItem[] {
  return SERVICE_KEYS.map((key) => ({
    name: tServices(`items.${key}.name`),
    text: tServices(`items.${key}.text`),
  }));
}
