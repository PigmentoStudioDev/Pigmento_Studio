/**
 * El modo por defecto del sitio.
 *
 * Existe porque la decision no se ve en ningun sitio del CSS: el default vive en
 * una constante de este modulo y en un script inline de siete lineas. Sin un test,
 * devolverlo a `prefers-color-scheme` parece una mejora — es lo que recomienda
 * media guia — y nadie se entera hasta que el sitio abre en oscuro en la mitad de
 * las visitas.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { themeModeClass } from "./zone";

/**
 * El store cachea el modo en una variable de MODULO. En una pagina real eso se
 * reinicia en cada carga; aqui hay que pedirlo, o el segundo caso leeria lo que
 * dejo el primero.
 */
async function fresh() {
  vi.resetModules();
  return import("./mode");
}

afterEach(() => {
  localStorage.clear();
  document.documentElement.className = "";
  vi.unstubAllGlobals();
});

describe("modo de tema", () => {
  it("sin preferencia guardada abre en claro", async () => {
    const { getThemeMode, getServerThemeMode } = await fresh();

    expect(getThemeMode()).toBe("light");
    // Y el servidor dice lo mismo: es lo que hace que la primera pintura no salte.
    expect(getServerThemeMode()).toBe("light");
  });

  /**
   * EL caso de este archivo. Con el sistema en oscuro y sin preferencia guardada,
   * el sitio sigue abriendo en claro: el default es una decision de marca y no del
   * sistema operativo.
   */
  it("el sistema en oscuro no decide por el sitio", async () => {
    vi.stubGlobal("matchMedia", (query: string) => ({
      matches: true,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    }));

    const { getThemeMode, themeModeScript } = await fresh();

    expect(getThemeMode()).toBe("light");
    // El script del <head> es la otra mitad: si consultara la media query, la
    // primera pintura saldria oscura aunque getThemeMode() dijera claro.
    expect(themeModeScript()).not.toContain("prefers-color-scheme");
  });

  it("una preferencia guardada manda sobre el default", async () => {
    localStorage.setItem("pigmento-theme", "dark");

    const { getThemeMode, themeModeScript } = await fresh();

    expect(getThemeMode()).toBe("dark");
    expect(themeModeScript()).toContain(themeModeClass("dark"));
  });

  it("el script del head pinta la clase clara cuando no hay nada guardado", async () => {
    const { themeModeScript } = await fresh();

    // eslint-disable-next-line no-new-func -- es el mismo string que va al <head>
    new Function(themeModeScript())();

    expect(document.documentElement.classList.contains(themeModeClass("light"))).toBe(true);
  });
});
