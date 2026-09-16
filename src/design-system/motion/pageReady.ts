/**
 * La sincronia con el preloader. El CSS espera al atributo; GSAP espera a la promesa.
 *
 * El atributo lo pone un script inline ANTES de la primera pintura, y solo cuando el
 * loader va a correr: sin JS, con reduced-motion o ya visto en la sesion, no hay
 * atributo y todo entra al montar como siempre.
 */
export const PAGE_STATUS = "data-page-status";
export const PRELOADER_SEEN_KEY = "pg:preloader";

export function pageStatusScript(): string {
  return (
    "(function(){try{" +
    "if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;" +
    `if(sessionStorage.getItem('${PRELOADER_SEEN_KEY}'))return;` +
    `document.documentElement.setAttribute('${PAGE_STATUS}','loading')` +
    "}catch(e){}})()"
  );
}

let resolveReady: (() => void) | undefined;
let ready: Promise<void> | undefined;

export function isPageLoading(): boolean {
  return (
    typeof document !== "undefined" &&
    document.documentElement.getAttribute(PAGE_STATUS) === "loading"
  );
}

export function whenPageReady(): Promise<void> {
  if (!isPageLoading()) return Promise.resolve();

  ready ??= new Promise((resolve) => {
    resolveReady = resolve;
  });

  return ready;
}

export function markPageReady(): void {
  document.documentElement.setAttribute(PAGE_STATUS, "ready");
  try {
    sessionStorage.setItem(PRELOADER_SEEN_KEY, "1");
  } catch {
    // Sin storage (modo privado estricto) el loader se repite; no es un fallo.
  }
  resolveReady?.();
}
