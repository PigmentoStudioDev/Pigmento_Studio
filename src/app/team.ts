import type { TeamProps } from "@/design-system/components/organisms/Team/Team";

/**
 * El equipo. Vive en app/ y no en el design system por lo mismo que el resto del
 * contenido del sitio: el contrato de modularidad exige que el DS pueda salir de este
 * repo sin arrastrarlo.
 *
 * TODO(contenido): los NOMBRES y las FOTOS son marcadores de posicion. No me los
 * invento — son personas reales, y un nombre inventado en la pagina de un estudio es
 * de las pocas cosas que no se pueden "arreglar despues". Los oficios si son los del
 * estudio. Hacen falta cinco retratos verticales y sus nombres para cerrar el bloque.
 */
type Translate = (key: string) => string;

/**
 * Los retratos, por ahora piezas del portafolio: llenan el encuadre vertical y dejan
 * ver el gesto, que es lo que hay que poder juzgar antes de tener las fotos buenas.
 */
const PORTRAITS = [
  { src: "/portfolio/02.png", width: 522, height: 715 },
  { src: "/portfolio/05.png", width: 516, height: 775 },
  { src: "/portfolio/07.png", width: 521, height: 715 },
  { src: "/portfolio/10.png", width: 523, height: 753 },
  { src: "/portfolio/13.png", width: 520, height: 796 },
];

const MEMBERS = ["one", "two", "three", "four", "five"] as const;

export function getTeam(t: Translate): TeamProps {
  return {
    title: t("title"),
    label: t("label"),
    intro: t("intro"),
    members: MEMBERS.map((key, index) => ({
      name: t(`${key}.name`),
      role: t(`${key}.role`),
      photo: PORTRAITS[index],
    })),
  };
}
