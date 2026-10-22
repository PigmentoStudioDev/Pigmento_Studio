import styles from "./NavToggle.module.scss";

/**
 * El boton que abre y cierra el panel de navegacion: dos barras que se cruzan en
 * aspa mas su etiqueta.
 *
 * Sale a molecula aunque solo lo use la cabecera porque lo que encapsula no es
 * markup, es un contrato de accesibilidad: aria-expanded refleja el estado real y
 * aria-controls apunta al panel que gobierna. Aislado, ese contrato tiene su
 * propio test; incrustado en la cabecera, se comprueba de refilon o no se
 * comprueba.
 *
 * Es la excepcion a las props serializables que la regla ya contempla: un
 * componente interactivo recibe callbacks. La regla vigila lo que alimenta el
 * CMS, y el CMS no alimenta un onToggle.
 */
export interface NavToggleProps {
  open: boolean;
  /** id del panel que abre. Va a aria-controls. */
  controls: string;
  label: string;
  onToggle: () => void;
}

export function NavToggle({ open, controls, label, onToggle }: NavToggleProps) {
  return (
    <button
      type="button"
      aria-expanded={open}
      aria-controls={controls}
      onClick={onToggle}
      className={[styles.root, open ? styles.isOpen : styles.isClosed].join(" ")}
    >
      <span aria-hidden="true" className={styles.bars}>
        <span className={styles.bar} />
        <span className={styles.bar} />
      </span>
      <span className={styles.label}>{label}</span>
    </button>
  );
}
