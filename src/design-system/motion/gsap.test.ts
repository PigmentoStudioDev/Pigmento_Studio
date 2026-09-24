import { beforeAll, describe, expect, it } from "vitest";
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
