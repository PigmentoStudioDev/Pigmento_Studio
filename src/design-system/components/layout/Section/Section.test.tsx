/**
 * PATRON DE TEST DE COMPONENTE del design system. Todo componente nuevo trae:
 *
 *   1. contrato publico — las props que declara producen el DOM ACCESIBLE que
 *      promete. Se consulta por rol y nombre, nunca por clase: una clase es un
 *      detalle de implementacion, el rol es lo que ve quien usa el sitio.
 *   2. accesibilidad — jest-axe, ya cableado en src/test/setup.ts.
 *   3. comportamiento — solo si el componente es interactivo (user-event).
 *
 * Y en los que tienen .module.scss, el cierre del circuito TS <-> Sass: que cada
 * clase que el componente pone en el DOM exista de verdad en su hoja. Sin esto un
 * mapa de variantes con un typo pasa verde — el DOM lleva la clase y nadie mira si
 * el Sass la declara.
 */
import { join } from "node:path";
import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { compile, type Options } from "sass";
import { describe, expect, it } from "vitest";
import { Section, type SectionSpacing, type SectionTheme, type SectionWidth } from "./Section";

const WIDTHS: SectionWidth[] = ["content", "wide", "full"];
const SPACINGS: SectionSpacing[] = ["none", "compact", "default", "loose"];
const THEMES: SectionTheme[] = ["white", "g10", "g90", "g100"];

const SASS: Options<"sync"> = { loadPaths: ["node_modules"], quietDeps: true };

/** Las clases que declara la hoja del componente, con su nombre de origen. */
const declared = new Set(
  [
    ...compile(join(__dirname, "Section.module.scss"), SASS).css.matchAll(
      /\.([a-zA-Z][\w-]*)/g,
    ),
  ].map(([, name]) => name),
);

const sectionOf = (container: HTMLElement) => {
  const el = container.querySelector("section");
  if (!el) throw new Error("Section no renderizo un <section>");
  return el;
};

describe("Section", () => {
  it("renderiza su contenido dentro de un <section>", () => {
    const { container } = render(<Section>contenido</Section>);

    expect(sectionOf(container)).toHaveTextContent("contenido");
  });

  it("con labelledBy es un landmark region con nombre accesible", () => {
    render(
      <Section labelledBy="titulo">
        <h2 id="titulo">Casos</h2>
      </Section>,
    );

    expect(screen.getByRole("region", { name: "Casos" })).toBeInTheDocument();
  });

  it("propaga id para que sirva de ancla", () => {
    const { container } = render(<Section id="casos">x</Section>);

    expect(sectionOf(container)).toHaveAttribute("id", "casos");
  });

  /**
   * Sin tema no se envuelve en <Theme>, y no es un atajo: <Theme> es cliente
   * (usePrefix) y anade SIEMPRE cds--layer-one, que reinicia la capa aunque no
   * haya cambio de tema. Una seccion que hereda el tema no debe tocar ninguna
   * de las dos cosas.
   */
  it("sin theme no emite ninguna clase de Carbon", () => {
    const { container } = render(<Section>x</Section>);

    expect(sectionOf(container).className).not.toContain("cds--");
  });

  it.each(THEMES)("con theme %s pone la zona de tema de Carbon", (theme) => {
    const { container } = render(<Section theme={theme}>x</Section>);

    expect(sectionOf(container)).toHaveClass(`cds--${theme}`);
  });

  /**
   * El contrato con la cabecera: la seccion publica su zona en un atributo propio.
   * La cabecera lo observa para adoptar el tema de lo que tiene debajo — leer en su
   * lugar las clases de Carbon la ataria a nombres que son de Carbon.
   */
  it.each(THEMES)("con theme %s publica su zona en data-theme-section", (theme) => {
    const { container } = render(<Section theme={theme}>x</Section>);

    expect(sectionOf(container)).toHaveAttribute("data-theme-section", theme);
  });

  it("sin theme no publica zona: no hay nada que observar", () => {
    const { container } = render(<Section>x</Section>);

    expect(sectionOf(container)).not.toHaveAttribute("data-theme-section");
  });

  /**
   * Cierra el circuito TS <-> Sass: cada variante tiene que poner en el DOM una
   * clase que la hoja declare de verdad.
   *
   * Se cuenta ADEMAS de comprobar la pertenencia, y esa es la parte que importa:
   * si un mapa apunta a una clase que el Sass no tiene, `styles.x` es undefined y
   * `join(' ')` lo convierte en cadena vacia — no en la palabra "undefined". La
   * clase no aparece rota en el DOM: simplemente no aparece, y comprobar solo
   * pertenencia pasa verde. El hueco unicamente se ve contando.
   *
   * Depende de css.modules.classNameStrategy = 'non-scoped' en vitest.config.mts:
   * sin procesar el CSS, Vitest devuelve un proxy que responde a cualquier clave.
   */
  it.each([
    ...WIDTHS.map((width) => ({ label: `width=${width}`, props: { width } })),
    ...SPACINGS.map((spacing) => ({ label: `spacing=${spacing}`, props: { spacing } })),
  ])("$label usa clases que existen en Section.module.scss", ({ props }) => {
    const { container } = render(<Section {...props}>x</Section>);
    const section = sectionOf(container);
    const inner = section.firstElementChild;

    const own = [...section.classList].filter((cls) => !cls.startsWith("cds--"));

    // root + la clase del eje width + la del eje spacing. Ni una menos.
    expect(own).toHaveLength(3);
    expect([...(inner?.classList ?? [])]).toHaveLength(1);
    expect(
      [...own, ...(inner?.classList ?? [])].filter((cls) => !declared.has(cls)),
    ).toEqual([]);
  });

  it.each([
    { label: "sin tema", props: {} },
    { label: "con tema propio", props: { theme: "g100" as const } },
  ])("$label no tiene violaciones de accesibilidad", async ({ props }) => {
    const { container } = render(
      <Section {...props} labelledBy="titulo">
        <h2 id="titulo">Casos</h2>
      </Section>,
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
