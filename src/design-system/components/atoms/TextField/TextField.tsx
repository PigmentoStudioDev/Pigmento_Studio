import { useId, useState, type ChangeEvent, type Ref } from "react";
import styles from "./TextField.module.scss";

/**
 * Un campo de texto con su etiqueta, su ayuda y su error.
 *
 * Es una FILA y no una caja: la etiqueta a la izquierda y lo escrito a la derecha, al
 * cuerpo de la entradilla, con un filete encima. La misma banda que abre cada bloque
 * del sitio (StripHeader), repetida por campo — un formulario de cajas dentro de una
 * placa se leia como un widget pegado encima de la pagina.
 *
 * Lo que se conserva del original de Arc es lo que lo hacia bueno: el error abre su
 * fila sin empujar de golpe y el campo nunca cambia de tamano al enfocarse.
 *
 * Un solo atomo para una y varias lineas porque comparten TODO menos el elemento: dos
 * atomos serian dos hojas que divergen en el primer ajuste de borde.
 *
 * Sin directiva de cliente propia: no tiene estado que viva fuera de quien lo usa, y
 * su unico consumidor ya cruza. Asi no es una linea mas en `clientBoundary.allow`.
 */
export interface TextFieldProps {
  label: string;
  /** El numero de la fila ("01"). Es lectura visual: el lector ya recorre en orden. */
  marker?: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  /** Una linea de ayuda debajo, que se anuncia junto con el campo. */
  description?: string;
  error?: string;
  multiline?: boolean;
  rows?: number;
  type?: "text" | "email";
  inputMode?: "text" | "email";
  autoComplete?: string;
  placeholder?: string;
  maxLength?: number;
  readOnly?: boolean;
  ref?: Ref<HTMLInputElement & HTMLTextAreaElement>;
}

export function TextField({
  label,
  marker,
  name,
  value,
  onChange,
  description,
  error,
  multiline = false,
  rows = 4,
  type = "text",
  inputMode,
  autoComplete,
  placeholder,
  maxLength,
  readOnly,
  ref,
}: TextFieldProps) {
  const id = useId();
  const hintId = description ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;

  // El ultimo error se queda pintado mientras su fila se cierra: si el texto se fuera
  // con el error, la fila se cerraria vacia y el cierre no se leeria como tal.
  const [lastError, setLastError] = useState(error);
  if (error && error !== lastError) setLastError(error);

  const shared = {
    id,
    name,
    value,
    placeholder,
    maxLength,
    readOnly,
    autoComplete,
    className: styles.control,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": [hintId, errorId].filter(Boolean).join(" ") || undefined,
    onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      onChange(event.target.value),
  };

  return (
    <div className={styles.root} data-invalid={error ? "true" : undefined}>
      <div className={styles.head}>
        {marker ? (
          <span className={styles.marker} aria-hidden="true">
            {marker}
          </span>
        ) : null}
        <label className={styles.label} htmlFor={id}>
          {label}
        </label>
      </div>

      {multiline ? (
        <textarea {...shared} ref={ref} rows={rows} />
      ) : (
        <input {...shared} ref={ref} type={type} inputMode={inputMode} />
      )}

      {description ? (
        <span id={hintId} className={styles.hint}>
          {description}
        </span>
      ) : null}

      {/* La fila existe siempre y se abre por atributo: montarla al aparecer el error
          no deja nada desde donde interpolar la altura. Tambien por eso el role="alert"
          es fijo: una region viva anuncia lo que CAMBIA dentro de ella, y los lectores
          de pantalla no siempre anuncian un nodo que nace ya con el role puesto. */}
      <span className={styles.message} data-open={error ? "true" : "false"}>
        <span className={styles.messageInner}>
          <span id={errorId} className={styles.error} role="alert">
            {error ?? lastError}
          </span>
        </span>
      </span>
    </div>
  );
}
