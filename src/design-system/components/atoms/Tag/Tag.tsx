import styles from "./Tag.module.scss";

/**
 * Distintivo corto: "Pronto", "Beta", "Nuevo".
 *
 * Es un <span>, no un boton ni un enlace, y eso es la mitad del componente: un
 * distintivo etiqueta al elemento que lo acompana, no es un control. Cuando el
 * distintivo tenga que filtrar o cerrarse sera otro componente, con su rol.
 */
export type TagTone = "neutral" | "info" | "progress";

export interface TagProps {
  children: string;
  tone?: TagTone;
}

const TONE: Record<TagTone, string> = {
  neutral: styles.toneNeutral,
  info: styles.toneInfo,
  progress: styles.toneProgress,
};

export function Tag({ children, tone = "neutral" }: TagProps) {
  return <span className={[styles.root, TONE[tone]].join(" ")}>{children}</span>;
}
