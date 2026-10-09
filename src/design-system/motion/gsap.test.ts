import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { loadMotion } from "./gsap";
import { BRAND_EASE, FOLLOW_EASE } from "./tokens";

describe("loadMotion", () => {
  // Una sola carga por pagina: las curvas se leen en ella, asi que la hoja tiene que
  // estar antes. Tal como las sirve el navegador, minificadas.
  beforeAll(() => {
    document.documentElement.style.setProperty("--pg-ease-default", "cubic-bezier(.625, .05, 0, 1)");
    document.documentElement.style.setProperty("--pg-ease-follow", "cubic-bezier(.215, .61, .355, 1)");
  });

  /**
   * Los hooks piden la curva por nombre. Si el registro fallara, gsap no avisa: cae a
   * su curva por defecto y el sitio entero se mueve con otra sensacion sin un error.
   * Se le da la curva como la sirve el navegador, minificada, que es el formato real.
   */
  it("registra la curva de marca leida de la hoja", async () => {
    const { gsap } = await loadMotion();
    const ease = gsap.parseEase(BRAND_EASE);

    expect(typeof ease).toBe("function");
    // Arranca decidida y frena largo: a mitad de tiempo ya va muy por delante.
    expect(ease(0.5)).toBeGreaterThan(0.7);
    expect(ease(0.5)).not.toBeCloseTo(gsap.parseEase("power1.out")(0.5), 2);
  });

  /**
   * Lo que persigue al puntero se reapunta en cada movimiento: `quickTo` arranca un
   * tween nuevo desde donde va. Con una curva que arranca lenta, cada reinicio vuelve a
   * arrancar lento y la pieza no llega nunca mientras el raton se mueve — el cursor se
   * rompio asi. La curva de seguir tiene que salir a toda velocidad.
   */
  it("registra la curva de seguir, que arranca a toda velocidad", async () => {
    const { gsap } = await loadMotion();
    const follow = gsap.parseEase(FOLLOW_EASE);

    expect(typeof follow).toBe("function");
    expect(follow(0.1)).toBeGreaterThan(0.2);
    expect(follow(0.1)).toBeGreaterThan(gsap.parseEase(BRAND_EASE)(0.1) * 3);
  });
});

/**
 * El ajuste de PAGINA de ScrollTrigger, que solo corre en un navegador de verdad.
 *
 * Se monta el modulo de cero en cada caso: `loadMotion()` memoiza para toda la vida de
 * la pagina, asi que con la instancia ya cargada esta rama no se vuelve a ejecutar y el
 * test pasaria verde sin haber mirado nada.
 */
describe("loadMotion · ScrollTrigger", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    Reflect.deleteProperty(document, "fonts");
  });

  /** Monta gsap y la puerta de cero, con `document.fonts` puesto y espias en ScrollTrigger. */
  async function cargarConFuentes() {
    vi.resetModules();

    const scrollTrigger = await import("gsap/ScrollTrigger");
    const refresh = vi.spyOn(scrollTrigger.ScrollTrigger, "refresh").mockImplementation(() => undefined);
    const config = vi.spyOn(scrollTrigger.ScrollTrigger, "config").mockImplementation(() => undefined);

    // jsdom no tiene motor de maquetacion y por tanto no tiene `document.fonts`. Es la
    // condicion de entrada de la rama, asi que sin ponerlo no hay nada que probar.
    Object.defineProperty(document, "fonts", { configurable: true, value: { ready: Promise.resolve() } });

    const { loadMotion } = await import("./gsap");
    await loadMotion();
    // La recalculada cuelga de una promesa: hay que dejar correr la cola de microtareas.
    await Promise.resolve();
    await Promise.resolve();

    return { refresh, config };
  }

  /**
   * La recalculada va en la forma DIFERIDA (`refresh(true)`), no en la inmediata.
   *
   * `refresh()` recalcula dentro de la propia microtarea de la promesa, que cae en
   * cualquier instante — incluido el que un efecto de React esta usando para crear sus
   * triggers. ScrollTrigger recorre ahi `_triggers` sin defenderse de un hueco
   * (`curTrigger.end`, mientras que el bucle hermano escribe `_triggers[i] || {}`), y el
   * sintoma es un `fromTo` que reventaba con "reading 'end'". `refresh(true)` lo pasa al
   * ticker de gsap y lo agrupa con cualquier otra recalculada pendiente.
   */
  it("recalcula en diferido cuando llega la fuente", async () => {
    const { refresh } = await cargarConFuentes();

    expect(refresh).toHaveBeenCalledWith(true);
  });

  /**
   * `config()` no se llama, y no es una omision.
   *
   * Lo unico que se le pedia era `ignoreMobileResize`, que gsap ya pone en ese mismo
   * valor al arrancar (`_ignoreMobileResize = Observer.isTouch === 1`): la llamada no
   * cambiaba nada. Lo que SI hacia es pasar por una linea que, sin `syncInterval`, deja
   * `_syncInterval` en `undefined` y pierde el handle del intervalo de sincronia que
   * ScrollTrigger arranca al iniciarse. Ese intervalo ya no se puede parar, y es lo que
   * despertaba con el entorno desmontado.
   */
  it("no toca la configuracion global de ScrollTrigger", async () => {
    const { config } = await cargarConFuentes();

    expect(config).not.toHaveBeenCalled();
  });
});
