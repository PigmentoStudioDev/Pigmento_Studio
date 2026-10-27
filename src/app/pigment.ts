import type { CycledCandyFamily } from "@/design-system/theme/candy";
import type { PageTransitionPigment } from "@/design-system/motion/pageTransition";
import { SERVICE_KEYS, SERVICE_PATHS, type ServiceKey } from "./service-pages";

/**
 * El color de cada servicio (decision de Karen, 2026-10-26). Es lo que hace que un
 * resalte, una baldosa o el formulario de una pagina de servicio digan de QUE
 * disciplina se habla; los cuatro juntos son el pigmento del estudio.
 *
 * Separados en temperatura para que dos servicios vecinos no se confundan.
 */
export const SERVICE_FAMILY: Record<ServiceKey, CycledCandyFamily> = {
  branding: "pink",
  motion: "periwinkle",
  web: "lime",
  marketing: "tangerine",
};

/** La cortina hacia la pagina de un servicio lleva su color: dice adonde vas antes de llegar. */
export const TRANSITION_PIGMENTS: PageTransitionPigment[] = SERVICE_KEYS.map((key) => ({
  path: SERVICE_PATHS[key],
  family: SERVICE_FAMILY[key],
}));
