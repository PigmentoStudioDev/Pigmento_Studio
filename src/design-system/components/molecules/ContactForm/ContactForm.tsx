"use client";

import type { CycledCandyFamily } from "../../../theme/candy";
import { useEffect, useId, useLayoutEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { Button } from "../../atoms/Button/Button";
import { Icon } from "../../atoms/Icon/Icon";
import { TextField } from "../../atoms/TextField/TextField";
import { PhoneField, type PhoneFieldCopy } from "../PhoneField/PhoneField";
import styles from "./ContactForm.module.scss";
import {
  MAX_EXTRA,
  MAX_MESSAGE,
  validateContact,
  type ContactErrorCode,
  type ContactErrors,
  type ContactMessage,
  type ContactValues,
} from "./validate";

/**
 * El formulario de contacto: valida, envia y se convierte en su propia confirmacion.
 *
 * Es el bloque `contact-section` de Arc en su variante `form`, portado por ANATOMIA:
 * los mismos campos, los errores que aparecen tras el primer envio y se corrigen al
 * escribir, los temas como grupo de radio, y la cara que pasa de formulario a
 * confirmacion cambiando de altura en vez de saltar. La forma ya no es la de Arc:
 * cada pregunta es una fila numerada con filete, la banda con la que abre cada bloque.
 * Lo que no viene es `motion`: aqui cada gesto es una transicion de su hoja.
 *
 * El envio llega como callback y NO se simula si falta. Un formulario que dice
 * "enviado" sin haber mandado nada es peor que no tener formulario: quien escribe se
 * va esperando una respuesta que nunca llega. Sin `onSubmit`, el boton no se pinta.
 */
export interface ContactFormCopy {
  formLabel: string;
  name: string;
  namePlaceholder: string;
  email: string;
  emailPlaceholder: string;
  phone: PhoneFieldCopy;
  topic: string;
  message: string;
  messagePlaceholder: string;
  /** Con `{count}`: lo sustituye el componente porque el numero cambia al escribir. */
  remaining: string;
  submit: string;
  sending: string;
  failure: string;
  /** Con `{name}`: el nombre de pila de quien escribio. */
  successTitle: string;
  successText: string;
  again: string;
  errors: Record<ContactErrorCode, string>;
}

export interface ContactTopic {
  value: string;
  label: string;
  /** El color del servicio, en la casilla. Sin el ("Otro"), la casilla de linea. */
  family?: CycledCandyFamily;
}

/** Una clase por familia, explicita: el gate cruza el TSX con la hoja. */
const BOX_FAMILY: Record<CycledCandyFamily, string> = {
  pink: styles.boxPink,
  periwinkle: styles.boxPeriwinkle,
  tangerine: styles.boxTangerine,
  lime: styles.boxLime,
};

/**
 * Lo que cambia de un formulario a otro entre paginas de servicio (ronda 2 de
 * Pigmento): web no pide telefono, marketing pide empresa, sitio y objetivo. Lo que
 * no se nombra aqui se queda como en la home.
 */
export interface ContactFormFields {
  /** false quita el telefono. */
  phone?: boolean;
  /** Rotulo del campo de empresa; sin valor no se pide. */
  company?: string;
  /** Rotulo del campo de sitio o redes; sin valor no se pide. */
  website?: string;
  /** Una segunda pregunta de opcion unica ("Cual es tu principal objetivo?"). */
  goal?: { label: string; options: ContactTopic[] };
}

export interface ContactFormProps {
  copy: ContactFormCopy;
  /** El idioma de los nombres de pais en el telefono. */
  locale: string;
  topics: ContactTopic[];
  fields?: ContactFormFields;
  /** Resuelve y se ve la confirmacion; rechaza y el formulario se queda con un aviso. */
  onSubmit?: (message: ContactMessage) => Promise<void>;
}

type Phase = "editing" | "sending" | "sent";

const EMPTY: ContactValues = { name: "", email: "", phone: "", message: "" };

/**
 * Desde cuantos caracteres restantes se ve el contador. Un "quedan 1000" fijo bajo un
 * campo vacio es ruido: solo informa cuando el limite empieza a estar cerca.
 */
const REMAINING_HINT = 100;

export function ContactForm({ copy, locale, topics, fields = {}, onSubmit }: ContactFormProps) {
  const [values, setValues] = useState(EMPTY);
  const [topic, setTopic] = useState(topics[0]?.value ?? "");
  const [extra, setExtra] = useState({ company: "", website: "" });
  const [goal, setGoal] = useState(fields.goal?.options[0]?.value ?? "");
  const withPhone = fields.phone !== false;
  const [errors, setErrors] = useState<ContactErrors>({});
  const [tried, setTried] = useState(false);
  const [phase, setPhase] = useState<Phase>("editing");
  const [failed, setFailed] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [morphed, setMorphed] = useState(false);

  const nameRef = useRef<HTMLInputElement & HTMLTextAreaElement>(null);
  const emailRef = useRef<HTMLInputElement & HTMLTextAreaElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const messageRef = useRef<HTMLInputElement & HTMLTextAreaElement>(null);
  const successRef = useRef<HTMLHeadingElement>(null);
  const backToForm = useRef(false);
  const card = useMorphHeight<HTMLDivElement>(phase === "sent");

  // El foco sigue a la cara que se ve: quien envia con teclado no puede quedarse con
  // el foco en un boton que acaba de desaparecer.
  useEffect(() => {
    if (phase === "sent") successRef.current?.focus();
    if (phase === "editing" && backToForm.current) {
      backToForm.current = false;
      nameRef.current?.focus();
    }
  }, [phase]);

  const update = (field: keyof ContactValues) => (value: string) => {
    const next = { ...values, [field]: value };
    setValues(next);
    // Antes del primer envio no se rinen campos a medio escribir.
    if (tried) setErrors(validateContact(next));
  };

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (phase !== "editing" || !onSubmit) return;

    setTried(true);
    setFailed(false);
    const found = validateContact(withPhone ? values : { ...values, phone: "" });
    setErrors(found);

    // El foco va al PRIMER campo con error, en orden de lectura.
    if (found.name) return nameRef.current?.focus();
    if (found.email) return emailRef.current?.focus();
    if (found.phone) return phoneRef.current?.focus();
    if (found.message) return messageRef.current?.focus();

    const message: ContactMessage = {
      name: values.name.trim(),
      email: values.email.trim(),
      phone: values.phone.trim(),
      topic,
      message: values.message.trim(),
      ...(fields.company ? { company: extra.company.trim() } : {}),
      ...(fields.website ? { website: extra.website.trim() } : {}),
      ...(fields.goal ? { goal } : {}),
    };

    setPhase("sending");
    try {
      await onSubmit(message);
      setFirstName(message.name.split(/\s+/)[0] ?? message.name);
      setMorphed(true);
      setPhase("sent");
    } catch {
      setPhase("editing");
      setFailed(true);
    }
  }

  function again() {
    setValues(EMPTY);
    setErrors({});
    setTried(false);
    setFailed(false);
    backToForm.current = true;
    setPhase("editing");
  }

  const errorText = (code?: ContactErrorCode) => (code ? copy.errors[code] : undefined);
  const markers = numberRows({
    topic: topics.length > 0,
    company: Boolean(fields.company),
    website: Boolean(fields.website),
    phone: withPhone,
    goal: Boolean(fields.goal),
  });
  const sending = phase === "sending";

  return (
    <div ref={card} className={styles.card} data-morphed={morphed ? "true" : undefined}>
      {phase === "sent" ? (
        <div key="sent" aria-live="polite">
          <div className={styles.success}>
            <span className={styles.mark}>
              <Icon name="check" />
            </span>
            <h3 ref={successRef} tabIndex={-1} className={styles.successTitle}>
              {copy.successTitle.replace("{name}", firstName)}
            </h3>
            <p className={styles.successText}>{copy.successText}</p>
            <Button emphasis="secondary" onClick={again}>
              {copy.again}
            </Button>
          </div>
        </div>
      ) : (
        <form key="form" className={styles.form} onSubmit={submit} noValidate aria-label={copy.formLabel}>
          {/* El tema primero, como en un brief: decir que se necesita ordena lo demas,
              y es la unica pregunta que se contesta sin escribir. */}
          {topics.length > 0 ? (
            <TopicPicker
              marker={markers.topic}
              label={copy.topic}
              topics={topics}
              value={topic}
              onChange={setTopic}
              disabled={sending}
            />
          ) : null}

          <TextField
            ref={nameRef}
            marker={markers.name}
            label={copy.name}
            name="name"
            autoComplete="name"
            placeholder={copy.namePlaceholder}
            value={values.name}
            onChange={update("name")}
            error={errorText(errors.name)}
            readOnly={sending}
          />

          <TextField
            ref={emailRef}
            marker={markers.email}
            label={copy.email}
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder={copy.emailPlaceholder}
            value={values.email}
            onChange={update("email")}
            error={errorText(errors.email)}
            readOnly={sending}
          />

          {fields.company ? (
            <TextField
              marker={markers.company}
              label={fields.company}
              name="company"
              autoComplete="organization"
              maxLength={MAX_EXTRA}
              value={extra.company}
              onChange={(value) => setExtra({ ...extra, company: value })}
              readOnly={sending}
            />
          ) : null}
          {withPhone ? (
            <PhoneField
              ref={phoneRef}
              marker={markers.phone}
              copy={copy.phone}
              locale={locale}
              name="phone"
              onChange={update("phone")}
              error={errorText(errors.phone)}
              readOnly={sending}
            />
          ) : null}
          {fields.website ? (
            <TextField
              marker={markers.website}
              label={fields.website}
              name="website"
              autoComplete="url"
              maxLength={MAX_EXTRA}
              value={extra.website}
              onChange={(value) => setExtra({ ...extra, website: value })}
              readOnly={sending}
            />
          ) : null}
          {fields.goal ? (
            <TopicPicker
              marker={markers.goal}
              label={fields.goal.label}
              topics={fields.goal.options}
              value={goal}
              onChange={setGoal}
              disabled={sending}
            />
          ) : null}

          <TextField
            ref={messageRef}
            marker={markers.message}
            multiline
            rows={3}
            label={copy.message}
            name="message"
            placeholder={copy.messagePlaceholder}
            maxLength={MAX_MESSAGE}
            value={values.message}
            onChange={update("message")}
            description={
              MAX_MESSAGE - values.message.length <= REMAINING_HINT
                ? copy.remaining.replace("{count}", String(MAX_MESSAGE - values.message.length))
                : undefined
            }
            error={errorText(errors.message)}
            readOnly={sending}
          />

          <div className={styles.footer}>
            <p className={styles.failure} data-open={failed ? "true" : "false"} role="alert">
              <span className={styles.failureInner}>{failed ? copy.failure : null}</span>
            </p>

            {onSubmit ? (
              <div className={styles.submitRow}>
                <Button type="submit" size="lg" icon="arrow-up-right" disabled={sending}>
                  {sending ? copy.sending : copy.submit}
                </Button>
              </div>
            ) : null}
          </div>
        </form>
      )}
    </div>
  );
}

const pad = (n: number) => String(n).padStart(2, "0");

/** El numero de cada fila. Sin temas la cuenta empieza en el nombre: un "02" de entrada lee como una fila perdida. */
type Row = "topic" | "name" | "email" | "company" | "phone" | "website" | "goal" | "message";
const ROW_ORDER: readonly Row[] = ["topic", "name", "email", "company", "phone", "website", "goal", "message"];

// El numero de cada fila depende de cuales se piden: sin telefono, el mensaje es el 04
// y no el 05, o la secuencia saltaria un numero que nadie ve.
function numberRows(present: Partial<Record<Row, boolean>>) {
  const order = ROW_ORDER.filter((row) => present[row] ?? true);
  return Object.fromEntries(order.map((row, i) => [row, pad(i + 1)])) as Record<Row, string>;
}

/**
 * Los temas como grupo de radio, en lista: un solo punto de tabulacion y las flechas
 * mueven la eleccion, como un grupo de radio nativo. Es la misma fila que los campos —
 * numero y pregunta a la izquierda, las respuestas a la derecha al cuerpo de lo
 * escrito —, asi que la lista se lee como una pregunta mas y no como un control aparte.
 */
function TopicPicker({
  marker,
  label,
  topics,
  value,
  onChange,
  disabled,
}: {
  marker: string;
  label: string;
  topics: ContactTopic[];
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
}) {
  const labelId = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const index = Math.max(0, topics.findIndex((topic) => topic.value === value));

  function onKeyDown(event: KeyboardEvent) {
    const delta =
      event.key === "ArrowRight" || event.key === "ArrowDown"
        ? 1
        : event.key === "ArrowLeft" || event.key === "ArrowUp"
          ? -1
          : 0;
    if (!delta || disabled) return;
    event.preventDefault();
    const next = (index + delta + topics.length) % topics.length;
    onChange(topics[next]!.value);
    refs.current[next]?.focus();
  }

  return (
    <div className={styles.topicField}>
      <div className={styles.topicHead}>
        <span className={styles.topicMarker} aria-hidden="true">
          {marker}
        </span>
        <span id={labelId}>{label}</span>
      </div>
      <div className={styles.topics} role="radiogroup" aria-labelledby={labelId} onKeyDown={onKeyDown}>
        {topics.map((topic, i) => {
          const checked = i === index;
          return (
            <button
              key={topic.value}
              ref={(node) => {
                refs.current[i] = node;
              }}
              type="button"
              role="radio"
              aria-checked={checked}
              tabIndex={checked ? 0 : -1}
              disabled={disabled}
              className={styles.topic}
              onClick={() => onChange(topic.value)}
            >
              <span className={topic.family ? `${styles.box} ${BOX_FAMILY[topic.family]}` : styles.box} aria-hidden="true" />
              {topic.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * La tarjeta cambia de altura entre caras en vez de saltar. Entre cambios la altura es
 * automatica, asi que un campo que crece por dentro nunca queda recortado.
 */
function useMorphHeight<T extends HTMLElement>(key: boolean) {
  const ref = useRef<T>(null);
  const last = useRef(0);
  const lastKey = useRef(key);

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof ResizeObserver === "undefined") return;
    last.current = node.offsetHeight;
    const observer = new ResizeObserver(() => {
      if (!node.style.blockSize) last.current = node.offsetHeight;
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useLayoutEffect(() => {
    const node = ref.current;
    if (!node || lastKey.current === key) return;
    lastKey.current = key;
    const from = last.current;
    const to = node.scrollHeight;
    if (!from || Math.abs(from - to) < 1) return;

    node.style.blockSize = `${from}px`;
    // Forzar el estilo calculado es lo que hace que la transicion arranque en `from`
    // en vez de saltar directamente a `to` en el mismo fotograma.
    void node.offsetHeight;
    node.style.blockSize = `${to}px`;

    const release = () => {
      node.style.blockSize = "";
      last.current = node.offsetHeight;
    };
    // Con reduced-motion la hoja no declara transicion y el evento no llega nunca.
    const hasTransition = getComputedStyle(node).transitionDuration.split(",").some((d) => parseFloat(d) > 0);
    if (!hasTransition) return release();
    node.addEventListener("transitionend", release, { once: true });
    return () => node.removeEventListener("transitionend", release);
  }, [key]);

  return ref;
}
