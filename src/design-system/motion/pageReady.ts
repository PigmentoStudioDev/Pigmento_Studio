/**
 * La sincronia con el preloader. El CSS espera al atributo; GSAP espera a la promesa.
 *
 * El atributo lo pone un script inline ANTES de la primera pintura, y solo cuando el
 * loader va a correr: sin JS, con reduced-motion o ya visto en la sesion, no hay
 * atributo y todo entra al montar como siempre.
 */
export const PAGE_STATUS = "data-page-status";
export const PRELOADER_SEEN_KEY = "pg:preloader";

/**
 * La salida de emergencia del preloader. Quien lo quita es React, en el
 * `animationstart` del panel; si el JS no llega —un chunk que falla, un error de
 * hidratacion— el panel fijo tapaba la pagina para siempre y los reveals se quedaban
 * en pausa. El propio script que pone `loading` deja programado el `ready`, mas tarde
 * que la secuencia entera (~2.4 s), asi que en una carga normal nunca se nota.
 */
export const PRELOADER_FAILSAFE_MS = 4000;

export function pageStatusScript(): string {
  return (
    "(function(){try{" +
    "if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;" +
    `if(sessionStorage.getItem('${PRELOADER_SEEN_KEY}'))return;` +
    "var d=document.documentElement;" +
    `d.setAttribute('${PAGE_STATUS}','loading');` +
    `setTimeout(function(){if(d.getAttribute('${PAGE_STATUS}')==='loading')d.setAttribute('${PAGE_STATUS}','ready')},${PRELOADER_FAILSAFE_MS})` +
    "}catch(e){}})()"
  );
}

let ready: Promise<void> | undefined;

export function isPageLoading(): boolean {
  return (
    typeof document !== "undefined" &&
    document.documentElement.getAttribute(PAGE_STATUS) === "loading"
  );
}

export function whenPageReady(): Promise<void> {
  if (!isPageLoading()) return Promise.resolve();

  // Se espera al ATRIBUTO y no a markPageReady: la salida de emergencia lo cambia
  // desde el script inline, que no puede tocar esta promesa. Con una sola fuente de
  // verdad, el CSS y GSAP sueltan la pagina en el mismo instante la quite quien la
  // quite.
  ready ??= new Promise((resolve) => {
    const observer = new MutationObserver(() => {
      if (isPageLoading()) return;
      observer.disconnect();
      ready = undefined;
      resolve();
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: [PAGE_STATUS] });
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
}
