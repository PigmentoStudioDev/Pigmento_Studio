"use client";

import { useSyncExternalStore } from "react";
import { Icon } from "../../atoms/Icon/Icon";
import {
  getMotionPaused,
  getServerMotionPaused,
  setMotionPaused,
  subscribeMotionPaused,
} from "../../../motion/motionPause";
import styles from "./MotionToggle.module.scss";

export interface MotionToggleProps {
  label: string;
}

/**
 * El control visible de WCAG 2.2.2: para y reanuda todos los bucles del sitio. Es un
 * interruptor —el nombre dice que es, aria-pressed si esta puesto— hermano de los de
 * tema e idioma.
 */
export function MotionToggle({ label }: MotionToggleProps) {
  const paused = useSyncExternalStore(subscribeMotionPaused, getMotionPaused, getServerMotionPaused);

  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={paused}
      onClick={() => setMotionPaused(!paused)}
      className={styles.root}
    >
      <Icon name={paused ? "play" : "pause"} />
    </button>
  );
}
