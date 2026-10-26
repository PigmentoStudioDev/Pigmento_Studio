import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  useSyncExternalStore,
  type ClipboardEvent,
  type KeyboardEvent,
  type MouseEvent,
  type Ref,
} from "react";
import { Icon } from "../../atoms/Icon/Icon";
import styles from "./PhoneField.module.scss";
import {
  BY_ISO,
  PHONE_COUNTRIES,
  capDigits,
  flagOf,
  formatNational,
  lengthsOf,
  onlyDigits,
  parsePhoneNumber,
  splitTrunk,
  statusOf,
  toE164,
  type PhoneCountry,
} from "./phone";

/**
 * Telefono con lada: un boton de pais que abre una lista con busqueda, y el numero que
 * se formatea mientras se escribe y sale en E.164.
 *
 * Portado de `phone-input` de Arc por ANATOMIA, como TextField: el mismo teclado (el
 * "+" en el numero abre la lista buscando por codigo, una letra en el boton busca por
 * pais, flechas, Inicio/Fin, Enter, Escape), la guia tenue con lo que falta del numero,
 * el borrado que salta separadores y el numero pegado que elige su propio pais. Lo que
 * no viene es `motion`: el boton no se transforma en la lista con un muelle, la lista
 * abre su fila debajo con el mismo `0fr` a `1fr` del error de TextField.
 *
 * La lista flota bajo el campo, por encima de lo que sigue. HACK: la tarjeta del
 * formulario tiene `overflow: clip`, asi que la lista cabe mientras debajo del telefono
 * queden mas campos que su alto (hoy, temas + mensaje + boton). Si el telefono pasa a
 * ser el ultimo campo, la lista se corta: entonces, popover en la capa superior.
 *
 * Sin directiva de cliente propia por lo mismo que TextField: su unico consumidor ya
 * cruza, y asi no es una entrada mas en `clientBoundary.allow`.
 */
export interface PhoneFieldCopy {
  label: string;
  /** Con `{country}` y `{dial}`: lo que lee el lector de pantalla en el boton. */
  country: string;
  search: string;
  searchPlaceholder: string;
  clearSearch: string;
  suggested: string;
  allCountries: string;
  /** Con `{query}`. */
  noMatches: string;
  /** Con `{count}`: se anuncia al filtrar. */
  results: string;
  /** Con `{country}`: se anuncia cuando el numero tiene la longitud de su pais. */
  valid: string;
}

export interface PhoneFieldProps {
  copy: PhoneFieldCopy;
  /** El numero de la fila ("04"), como en TextField. */
  marker?: string;
  /** El idioma de los nombres de pais, que da `Intl.DisplayNames`. */
  locale: string;
  /** Lleva el E.164 en un input oculto para el envio nativo. */
  name: string;
  /** Cada cambio, ya en E.164; vacio sin digitos. */
  onChange: (e164: string) => void;
  defaultCountry?: string;
  /** Fijados arriba de la lista. */
  preferredCountries?: string[];
  error?: string;
  readOnly?: boolean;
  ref?: Ref<HTMLInputElement>;
}

type Row = { key: string; entry: PhoneCountry };
type Group = { key: string; label?: string; rows: Row[] };

const PAGE = 8;

const subscribeNever = () => () => {};

/** El primer ancestro que recorta lo que se sale de su caja. */
function clippingAncestor(node: HTMLElement) {
  for (let parent = node.parentElement; parent; parent = parent.parentElement) {
    if (getComputedStyle(parent).overflowY !== "visible") return parent;
  }
  return null;
}

const fill = (template: string, values: Record<string, string | number>) =>
  template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ""));

// Sin acentos ni mayusculas: quien busca "mexico" tiene que encontrar "Mexico" con tilde.
const fold = (text: string) => text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();

/** Posicion en el texto formateado justo despues del digito n. */
function caretAfterDigits(text: string, count: number) {
  if (count <= 0) {
    const first = text.search(/\d/);
    return first < 0 ? text.length : first;
  }
  let seen = 0;
  for (let index = 0; index < text.length; index++) if (/\d/.test(text[index]!) && ++seen === count) return index + 1;
  return text.length;
}

export function PhoneField({
  copy,
  marker,
  locale,
  name,
  onChange,
  defaultCountry = "MX",
  preferredCountries = ["MX", "US", "CO"],
  error,
  readOnly = false,
  ref,
}: PhoneFieldProps) {
  const uid = useId();
  const inputId = `${uid}-number`;
  const listId = `${uid}-list`;
  const errorId = `${uid}-error`;
  const optionId = (key: string) => `${uid}-opt-${key}`;

  // Los nombres de pais salen del ICU de cada motor, y Node y el navegador no traen el
  // mismo ("Hong Kong SAR China" contra "Hong Kong"): pintados en servidor rompen la
  // hidratacion. Hasta hidratar se usa el codigo ISO, y la lista solo se monta abierta.
  const hydrated = useSyncExternalStore(subscribeNever, () => true, () => false);
  const regionNames = useMemo(() => new Intl.DisplayNames([locale], { type: "region" }), [locale]);
  const nameOf = useCallback(
    (iso: string) => (hydrated ? (regionNames.of(iso) ?? iso) : iso),
    [hydrated, regionNames],
  );

  const [state, setState] = useState({ iso: BY_ISO.has(defaultCountry) ? defaultCountry : "MX", digits: "" });
  const current = BY_ISO.get(state.iso)!;
  const digits = state.digits;
  const formatted = formatNational(current, digits);
  const valid = statusOf(current, digits) === "valid";

  // El ultimo error se queda pintado mientras su fila se cierra, como en TextField.
  const [lastError, setLastError] = useState(error);
  if (error && error !== lastError) setLastError(error);

  // Lo que falta del numero de ejemplo, en la forma que espera este pais, tenue detras.
  const guide = useMemo(() => {
    const [trunk, rest] = splitTrunk(current, digits);
    if (rest.length >= current.example.length) return "";
    const full = formatNational(current, trunk + rest + current.example.slice(rest.length));
    return full.startsWith(formatted) ? full.slice(formatted.length) : "";
  }, [current, digits, formatted]);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const setInputRef = (node: HTMLInputElement | null) => {
    inputRef.current = node;
    if (typeof ref === "function") ref(node);
    else if (ref) ref.current = node;
  };
  const pendingCaret = useRef<number | null>(null);
  const [, rerender] = useReducer((count: number) => count + 1, 0);
  const [announcement, setAnnouncement] = useState("");

  const setNumber = (nextDigits: string, caretDigits: number, entry = current) => {
    const capped = capDigits(entry, nextDigits);
    pendingCaret.current = Math.min(caretDigits, capped.length);
    // Un digito rechazado no cambia nada, y React devolveria el texto viejo con el
    // cursor al final: se repinta para volver a ponerlo donde estaba.
    if (capped === digits && entry.iso === current.iso) return rerender();
    setState({ iso: entry.iso, digits: capped });
    onChange(toE164(entry, capped));
  };

  useLayoutEffect(() => {
    const input = inputRef.current;
    const count = pendingCaret.current;
    pendingCaret.current = null;
    if (!input || count === null || document.activeElement !== input) return;
    const position = caretAfterDigits(input.value, count);
    input.setSelectionRange(position, position);
  });

  function adopt(parsed: { country: PhoneCountry; national: string }) {
    if (parsed.country.iso !== current.iso) setAnnouncement(nameOf(parsed.country.iso));
    setNumber(parsed.national, parsed.national.length, parsed.country);
  }

  /* ------------------------------------------------ El numero ------------------------------------------------ */

  function onNumberChange(input: HTMLInputElement) {
    const raw = input.value;
    // El autocompletado llega como cambio: un numero internacional elige su pais.
    if (raw.includes("+") || (/^\s*00/.test(raw) && onlyDigits(raw).length > 6)) {
      const parsed = parsePhoneNumber(raw.slice(Math.max(0, raw.indexOf("+"))));
      if (parsed?.national) return adopt(parsed);
    }
    const caret = input.selectionStart ?? raw.length;
    setNumber(onlyDigits(raw), onlyDigits(raw.slice(0, caret)).length);
  }

  function onNumberKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (readOnly) return;
    const input = event.currentTarget;
    if (event.key === "+" && !event.metaKey && !event.ctrlKey) {
      event.preventDefault();
      return openList("+");
    }
    const start = input.selectionStart ?? 0;
    const end = input.selectionEnd ?? 0;
    if (start !== end || event.metaKey || event.ctrlKey || event.altKey) return;
    // Borrar un separador borra el digito de al lado en vez de no hacer nada.
    if (event.key === "Backspace" && start > 0 && !/\d/.test(input.value[start - 1]!)) {
      event.preventDefault();
      const index = onlyDigits(input.value.slice(0, start)).length;
      if (index > 0) setNumber(digits.slice(0, index - 1) + digits.slice(index), index - 1);
    }
    if (event.key === "Delete" && start < input.value.length && !/\d/.test(input.value[start]!)) {
      event.preventDefault();
      const index = onlyDigits(input.value.slice(0, start)).length;
      setNumber(digits.slice(0, index) + digits.slice(index + 1), index);
    }
  }

  function onPaste(event: ClipboardEvent<HTMLInputElement>) {
    const text = event.clipboardData.getData("text");
    if (!text || readOnly) return;
    event.preventDefault();
    const input = event.currentTarget;
    const parsed = /^\s*(\+|00)/.test(text) ? parsePhoneNumber(text) : null;
    if (parsed) return adopt(parsed);
    let pasted = onlyDigits(text);
    // "52 55 1234 5678" pegado en un campo de Mexico: el codigo sobra si sin el no cabe.
    if (pasted.startsWith(current.dial) && pasted.length > capDigits(current, pasted).length) {
      pasted = pasted.slice(current.dial.length);
    }
    // Un numero entero sustituye lo que habia; un trozo entra donde esta el cursor.
    if (pasted.length >= Math.min(...lengthsOf(current))) return setNumber(pasted, pasted.length);
    const a = onlyDigits(input.value.slice(0, input.selectionStart ?? 0)).length;
    const b = onlyDigits(input.value.slice(0, input.selectionEnd ?? 0)).length;
    setNumber(digits.slice(0, a) + pasted + digits.slice(b), a + pasted.length);
  }

  /* ------------------------------------------------ La lista ------------------------------------------------ */

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<string | null>(null);

  const sorted = useMemo(
    () => [...PHONE_COUNTRIES].sort((a, b) => nameOf(a.iso).localeCompare(nameOf(b.iso), locale)),
    [locale, nameOf],
  );

  const matches = useCallback(
    (entry: PhoneCountry, needle: string) => {
      const asDigits = onlyDigits(needle);
      if (asDigits && /^[+\d\s()-]+$/.test(needle)) return entry.dial.startsWith(asDigits) || asDigits.startsWith(entry.dial);
      return fold(nameOf(entry.iso)).includes(needle) || entry.iso.toLowerCase() === needle;
    },
    [nameOf],
  );

  const needle = fold(query);
  const groups = useMemo<Group[]>(() => {
    if (needle && needle !== "+") {
      const hits = sorted.filter((entry) => matches(entry, needle));
      const asDigits = onlyDigits(needle);
      // Por codigo, el exacto primero: "+1" tiene que dar Estados Unidos antes que Barbados.
      if (asDigits) hits.sort((a, b) => Number(b.dial === asDigits) - Number(a.dial === asDigits) || a.dial.length - b.dial.length);
      return [{ key: "results", rows: hits.map((entry) => ({ key: `r-${entry.iso}`, entry })) }];
    }
    const pinned = preferredCountries.flatMap((iso) => (BY_ISO.has(iso) ? [BY_ISO.get(iso)!] : []));
    const all = { key: "all", label: copy.allCountries, rows: sorted.map((entry) => ({ key: `a-${entry.iso}`, entry })) };
    return pinned.length
      ? [{ key: "pinned", label: copy.suggested, rows: pinned.map((entry) => ({ key: `p-${entry.iso}`, entry })) }, all]
      : [all];
  }, [copy.allCountries, copy.suggested, matches, needle, preferredCountries, sorted]);

  const rows = useMemo(() => groups.flatMap((group) => group.rows), [groups]);
  const activeKey = active !== null && rows.some((row) => row.key === active) ? active : (rows[0]?.key ?? null);

  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const pendingFocus = useRef<"trigger" | "search" | "number" | null>(null);

  useLayoutEffect(() => {
    const target = pendingFocus.current;
    pendingFocus.current = null;
    if (target === "search") searchRef.current?.focus({ preventScroll: true });
    if (target === "trigger") triggerRef.current?.focus({ preventScroll: true });
    if (target === "number") {
      const input = inputRef.current;
      input?.focus({ preventScroll: true });
      input?.setSelectionRange(input.value.length, input.value.length);
    }
  }, [open]);

  // La lista no pasa del borde de lo que la recorta (la tarjeta del formulario): se mide
  // lo que queda hasta ahi y se deja el mismo aire que la separa del campo.
  const sheetRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const sheet = sheetRef.current;
    const scroller = scrollRef.current;
    if (!open || !sheet || !scroller) return;
    const clipper = clippingAncestor(sheet);
    const fit = () => {
      const limit = clipper ? clipper.getBoundingClientRect().bottom : window.innerHeight;
      const gap = parseFloat(getComputedStyle(sheet).marginBlockStart) || 0;
      // Contra el campo y no contra el panel: el panel entra desplazado por su
      // animacion, y medido en ese instante el aire de abajo saldria corto.
      const field = sheet.parentElement!.parentElement!.getBoundingClientRect().bottom;
      const top = field + gap + (scroller.getBoundingClientRect().top - sheet.getBoundingClientRect().top);
      const room = limit - top - gap;
      scroller.style.setProperty("--pf-room", `${Math.max(0, Math.floor(room))}px`);
    };
    fit();
    // El resize llega a decenas de eventos por segundo y `fit` mide layout: se
    // coalesce a una medicion por frame.
    let frame = 0;
    const onResize = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        fit();
      });
    };
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", onResize);
    };
  }, [open]);

  // La opcion activa se mantiene a la vista al moverse con teclado.
  useLayoutEffect(() => {
    // Por id y no por una tabla de refs: el id ya es el de `aria-activedescendant`.
    const node = open && activeKey ? document.getElementById(`${uid}-opt-${activeKey}`) : null;
    const scroller = scrollRef.current;
    if (!node || !scroller) return;
    const top = node.offsetTop;
    const bottom = top + node.offsetHeight;
    if (top < scroller.scrollTop) scroller.scrollTop = top;
    else if (bottom > scroller.scrollTop + scroller.clientHeight) scroller.scrollTop = bottom - scroller.clientHeight;
  }, [activeKey, open, uid]);

  function openList(seed = "") {
    if (readOnly || open) return;
    setQuery(seed);
    // Con la lista recien abierta se ven los sugeridos: si el pais esta ahi, ese es el activo.
    setActive(seed ? null : preferredCountries.includes(current.iso) ? `p-${current.iso}` : `a-${current.iso}`);
    setAnnouncement("");
    pendingFocus.current = "search";
    setOpen(true);
  }

  function close(focus: "trigger" | "number" | null) {
    pendingFocus.current = focus;
    setOpen(false);
  }

  function pick(entry: PhoneCountry | undefined) {
    if (!entry) return;
    if (entry.iso !== current.iso) {
      const nextDigits = capDigits(entry, digits);
      setState({ iso: entry.iso, digits: nextDigits });
      onChange(toE164(entry, nextDigits));
      setAnnouncement(`${nameOf(entry.iso)}, +${entry.dial}`);
    }
    close("number");
  }

  function onOptionClick(event: MouseEvent<HTMLElement>) {
    pick(BY_ISO.get(event.currentTarget.dataset.iso ?? ""));
  }

  function onSearchKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    const at = rows.findIndex((row) => row.key === activeKey);
    const go = (index: number) => {
      event.preventDefault();
      setActive(rows[Math.max(0, Math.min(rows.length - 1, index))]?.key ?? null);
    };
    switch (event.key) {
      case "ArrowDown": return go(at + 1);
      case "ArrowUp": return go(at - 1);
      case "PageDown": return go(at + PAGE);
      case "PageUp": return go(at - PAGE);
      case "Home": return query ? undefined : go(0);
      case "End": return query ? undefined : go(rows.length - 1);
      case "Enter":
        event.preventDefault();
        return pick(rows[at]?.entry);
      case "Escape":
        event.preventDefault();
        event.stopPropagation();
        return close("trigger");
      case "Tab":
        return close(null);
    }
  }

  function onTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      return openList();
    }
    if (event.key.length === 1 && event.key !== " " && !event.metaKey && !event.ctrlKey && !event.altKey) {
      event.preventDefault();
      openList(event.key);
    }
  }

  function onQuery(next: string) {
    setQuery(next);
    setActive(null);
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
    const text = fold(next);
    const count = text && text !== "+" ? sorted.filter((entry) => matches(entry, text)).length : sorted.length;
    setAnnouncement(text ? (count ? fill(copy.results, { count }) : fill(copy.noMatches, { query: next.trim() })) : "");
  }

  useEffect(() => {
    if (!open) return;
    const down = (event: PointerEvent) => {
      if (rootRef.current?.contains(event.target as Node)) return;
      pendingFocus.current = null;
      setOpen(false);
    };
    document.addEventListener("pointerdown", down);
    return () => document.removeEventListener("pointerdown", down);
  }, [open]);

  const e164 = toE164(current, digits);
  const describedBy = error ? errorId : undefined;

  return (
    <div
      ref={rootRef}
      className={styles.root}
      data-open={open ? "true" : "false"}
      data-invalid={error ? "true" : undefined}
      onBlur={(event) => {
        const next = event.relatedTarget as Node | null;
        if (open && next && !event.currentTarget.contains(next)) close(null);
      }}
    >
      <div className={styles.head}>
        {marker ? (
          <span className={styles.marker} aria-hidden="true">
            {marker}
          </span>
        ) : null}
        <label className={styles.label} htmlFor={inputId}>
          {copy.label}
        </label>
      </div>

      <div className={styles.anchor}>
      <div className={styles.control} data-invalid={error ? "true" : undefined} data-readonly={readOnly ? "true" : undefined}>
        <button
          ref={triggerRef}
          type="button"
          className={styles.trigger}
          disabled={readOnly}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listId}
          aria-label={fill(copy.country, { country: nameOf(current.iso), dial: current.dial })}
          onClick={() => (open ? close("trigger") : openList())}
          onKeyDown={onTriggerKeyDown}
        >
          <span className={styles.flag} aria-hidden="true">
            {flagOf(current.iso)}
          </span>
          <span className={styles.dial}>+{current.dial}</span>
          <span className={styles.chevron} aria-hidden="true">
            <Icon name="chevron" />
          </span>
        </button>

        <div className={styles.numberWrap}>
          <span className={styles.guide} aria-hidden="true">
            <span className={styles.guideTyped}>{formatted}</span>
            {guide}
          </span>
          <input
            ref={setInputRef}
            id={inputId}
            className={styles.number}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={formatted}
            readOnly={readOnly}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            onChange={(event) => onNumberChange(event.currentTarget)}
            onKeyDown={onNumberKeyDown}
            onPaste={onPaste}
          />
          <span className={styles.valid} data-on={valid ? "true" : "false"} aria-hidden="true">
            <Icon name="check" />
          </span>
        </div>
      </div>

      <div className={styles.picker} inert={!open}>
          <div ref={sheetRef} className={styles.sheet}>
          <div className={styles.searchRow}>
            <input
              ref={searchRef}
              className={styles.search}
              type="text"
              role="combobox"
              aria-label={copy.search}
              aria-expanded={open}
              aria-controls={listId}
              aria-autocomplete="list"
              aria-activedescendant={open && activeKey ? optionId(activeKey) : undefined}
              placeholder={copy.searchPlaceholder}
              value={query}
              autoComplete="off"
              spellCheck={false}
              onChange={(event) => onQuery(event.target.value)}
              onKeyDown={onSearchKeyDown}
            />
            {query ? (
              <button
                type="button"
                className={styles.clear}
                aria-label={copy.clearSearch}
                onPointerDown={(event) => event.preventDefault()}
                onClick={() => {
                  onQuery("");
                  searchRef.current?.focus();
                }}
              >
                <Icon name="close" />
              </button>
            ) : null}
          </div>

          {/* `data-lenis-prevent`: sin el, el scroll suave se queda la rueda y lo que
              se mueve es la pagina, no la lista. Como el panel de la cabecera. */}
          <div ref={scrollRef} className={styles.scroll} data-lenis-prevent>
            <div id={listId} role="listbox" aria-label={copy.allCountries} className={styles.options}>
              {open && groups.map((group) => {
                const body = group.rows.map((row) => {
                  const selected = row.entry.iso === current.iso;
                  return (
                    <div
                      key={row.key}
                      id={optionId(row.key)}
                      role="option"
                      aria-selected={selected}
                      className={styles.option}
                      data-active={row.key === activeKey ? "true" : undefined}
                      onPointerMove={(event) => {
                        if (event.pointerType === "mouse" && row.key !== activeKey) setActive(row.key);
                      }}
                      onPointerDown={(event) => event.preventDefault()}
                      data-iso={row.entry.iso}
                      onClick={onOptionClick}
                    >
                      <span className={styles.flag} aria-hidden="true">
                        {flagOf(row.entry.iso)}
                      </span>
                      <span className={styles.name}>{nameOf(row.entry.iso)}</span>
                      <span className={styles.meta}>+{row.entry.dial}</span>
                      <span className={styles.check} data-on={selected ? "true" : "false"} aria-hidden="true">
                        <Icon name="check" />
                      </span>
                    </div>
                  );
                });
                return group.label ? (
                  <div key={group.key} role="group" aria-labelledby={`${uid}-${group.key}`}>
                    <div id={`${uid}-${group.key}`} role="presentation" className={styles.groupLabel}>
                      {group.label}
                    </div>
                    {body}
                  </div>
                ) : (
                  <div key={group.key} role="presentation">
                    {body}
                  </div>
                );
              })}
              {open && rows.length === 0 ? <p className={styles.empty}>{fill(copy.noMatches, { query: query.trim() })}</p> : null}
            </div>
          </div>
          </div>
      </div>
      </div>

      <span className={styles.message} data-open={error ? "true" : "false"}>
        <span className={styles.messageInner}>
          <span id={error ? errorId : undefined} className={styles.error} role="alert">
            {error ?? lastError}
          </span>
        </span>
      </span>

      <input type="hidden" name={name} value={e164} />
      <span className={styles.srOnly} role="status" aria-live="polite">
        {announcement || (valid ? fill(copy.valid, { country: nameOf(current.iso) }) : "")}
      </span>
    </div>
  );
}
