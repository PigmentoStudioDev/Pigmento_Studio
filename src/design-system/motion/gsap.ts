/**
 * La unica puerta de gsap al proyecto (`gsap-import` en tsx-contract.json).
 *
 * Registrar un plugin es un efecto global: hacerlo desde cada componente deja el
 * orden de registro a merced de como el bundler ordene los imports. Aqui pasa una
 * vez.
 *
 * **Y se carga bajo demanda, que es el cambio que importa.** Con imports estaticos,
 * cualquiera que tocara esta puerta arrastraba gsap entero al bundle COMPARTIDO —
 * medido: 47.7kb gzip en el chunk comun, en un presupuesto de 230. Lo pagaban todas
 * las rutas, incluidas las que no animan nada. Con `import()` el paquete cae en su
 * propio trozo y solo lo pide quien de verdad va a animar.
 *
 * El precio es que ya no hay `useGSAP`: es un hook, y un hook no se puede pedir a
 * mitad de un render. Lo que aportaba era limpiar los tweens al desmontar, y eso lo
 * cubre el `revert()` de cada consumidor — que ya estaba escrito, porque matchMedia
 * lo necesitaba igual.
 */
export interface Motion {
  gsap: typeof import("gsap").gsap;
  ScrollTrigger: typeof import("gsap/ScrollTrigger").ScrollTrigger;
  SplitText: typeof import("gsap/SplitText").SplitText;
}

/** El contexto de consultas de medios de gsap, para tipar la limpieza. */
export type MatchMedia = ReturnType<Motion["gsap"]["matchMedia"]>;

/**
 * Una sola carga para toda la vida de la pagina, y una sola promesa mientras esta
 * en vuelo: dos componentes que monten a la vez piden lo mismo y el segundo espera
 * al primero en vez de disparar una segunda descarga y un segundo registro.
 */
let loaded: Motion | null = null;
let pending: Promise<Motion> | null = null;

export function loadMotion(): Promise<Motion> {
  if (loaded) return Promise.resolve(loaded);

  pending ??= (async () => {
    const [core, scrollTrigger, splitText] = await Promise.all([
      import("gsap"),
      import("gsap/ScrollTrigger"),
      import("gsap/SplitText"),
    ]);

    core.gsap.registerPlugin(scrollTrigger.ScrollTrigger, splitText.SplitText);

    loaded = {
      gsap: core.gsap,
      ScrollTrigger: scrollTrigger.ScrollTrigger,
      SplitText: splitText.SplitText,
    };

    return loaded;
  })();

  return pending;
}
