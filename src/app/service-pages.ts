import type { FaqProps } from "@/design-system/components/organisms/Faq/Faq";
import type { ProcessProps } from "@/design-system/components/organisms/Process/Process";

/**
 * El contenido de las cuatro paginas de servicio, una por disciplina.
 *
 * Las cuatro tienen la MISMA estructura —hero, proceso con su entregable por fase,
 * casos de la disciplina, preguntas y llamada final— y cambia lo que dice cada bloque.
 * Es la conclusion de `docs/research/paginas-de-servicio-copy.md`: lo que distingue una
 * pagina de servicio buena no es su forma, es nombrar el entregable y poner plazo donde
 * otros ponen adjetivos. Por eso el proceso hace aqui de "que incluye": cada fase cierra
 * con lo que recibes.
 *
 * Las fases y las preguntas se listan aqui y no se leen del diccionario: el orden es
 * una decision de la pagina, y una clave que sobre o falte en un idioma tiene que fallar
 * en el test de diccionarios, no salir como texto crudo.
 *
 * TODO(contenido): copy en borrador, pendiente de Karen. Los plazos son los que ya
 * publica la FAQ de la home (identidad 6-10 semanas, sitio 4-8); motion y marketing no
 * prometen plazo porque no hay uno escrito. Afirmaciones de proceso a confirmar: que la
 * pauta se factura aparte de los honorarios, que las cuentas de anuncios van a nombre del
 * cliente, que el dominio queda a su nombre, y que el naming se hace en casa.
 */
export const SERVICE_KEYS = ["branding", "motion", "marketing", "web"] as const;
export type ServiceKey = (typeof SERVICE_KEYS)[number];

/** Las rutas de las cuatro paginas, que no siempre coinciden con la clave (web-development). */
export const SERVICE_PATHS: Record<ServiceKey, string> = {
  branding: "/servicios/branding",
  motion: "/servicios/motion",
  marketing: "/servicios/marketing",
  web: "/servicios/web-development",
};

const PHASES: Record<ServiceKey, readonly string[]> = {
  branding: ["diagnosis", "strategy", "identity", "rollout"],
  motion: ["script", "storyboard", "animation", "delivery"],
  marketing: ["diagnosis", "plan", "execution", "measurement"],
  web: ["architecture", "design", "build", "launch"],
};

const QUESTIONS: Record<ServiceKey, readonly string[]> = {
  branding: ["price", "naming", "rebrand", "ownership"],
  motion: ["price", "time", "what", "brand"],
  marketing: ["price", "results", "accounts", "brand"],
  web: ["price", "time", "edit", "ownership"],
};

/** Lo que el diccionario tiene que traer de cada pagina; lo usa su test. */
export const SERVICE_PHASES = PHASES;
export const SERVICE_QUESTIONS = QUESTIONS;

type Translate = (key: string) => string;

/** `t` es el namespace `servicePages`. */
export function getServiceProcess(t: Translate, key: ServiceKey): ProcessProps {
  return {
    title: t(`${key}.process.title`),
    titleHighlight: t(`${key}.process.titleHighlight`),
    label: t("common.processLabel"),
    intro: t(`${key}.process.intro`),
    deliverableLabel: t("common.deliverableLabel"),
    phases: PHASES[key].map((phase) => ({
      title: t(`${key}.process.phases.${phase}.title`),
      text: t(`${key}.process.phases.${phase}.text`),
      deliverable: t(`${key}.process.phases.${phase}.deliverable`),
    })),
  };
}

export function getServiceFaq(t: Translate, key: ServiceKey): FaqProps {
  return {
    title: t("common.faqTitle"),
    titleHighlight: t("common.faqTitle"),
    label: t("common.faqLabel"),
    intro: t(`${key}.faq.intro`),
    items: QUESTIONS[key].map((question) => ({
      question: t(`${key}.faq.items.${question}.question`),
      answer: t(`${key}.faq.items.${question}.answer`),
    })),
  };
}
