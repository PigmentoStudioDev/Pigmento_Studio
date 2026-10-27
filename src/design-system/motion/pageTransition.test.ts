import { describe, expect, it } from "vitest";
import { pigmentFor, transitionTarget, type ClickLike, type LinkLike } from "./pageTransition";

const CURRENT = new URL("https://pigmento.test/servicios?x=1");

const PLAIN_CLICK: ClickLike = {
  button: 0,
  metaKey: false,
  ctrlKey: false,
  shiftKey: false,
  altKey: false,
  defaultPrevented: false,
};

function link(attrs: Record<string, string | true>): LinkLike {
  return {
    getAttribute: (name) => {
      const value = attrs[name];
      return typeof value === "string" ? value : null;
    },
    hasAttribute: (name) => name in attrs,
  };
}

describe("transitionTarget", () => {
  it("intercepta un enlace interno normal y devuelve su destino completo", () => {
    const url = transitionTarget(PLAIN_CLICK, link({ href: "/en/trabajo?p=2#caso" }), CURRENT);

    expect(url?.href).toBe("https://pigmento.test/en/trabajo?p=2#caso");
  });

  it.each([
    ["modificador meta", { ...PLAIN_CLICK, metaKey: true }],
    ["modificador ctrl", { ...PLAIN_CLICK, ctrlKey: true }],
    ["shift", { ...PLAIN_CLICK, shiftKey: true }],
    ["alt", { ...PLAIN_CLICK, altKey: true }],
    ["boton central", { ...PLAIN_CLICK, button: 1 }],
    ["clic ya cancelado", { ...PLAIN_CLICK, defaultPrevented: true }],
  ])("no intercepta con %s", (_label, click) => {
    expect(transitionTarget(click, link({ href: "/trabajo" }), CURRENT)).toBeNull();
  });

  it.each([
    ["target _blank", { href: "/trabajo", target: "_blank" }],
    ["download", { href: "/trabajo", download: "" }],
    ["origen externo", { href: "https://otra.test/trabajo" }],
    ["sin href", {}],
    ["admin", { href: "/admin/collections" }],
    ["api en ingles", { href: "/en/api/mcp" }],
    ["api en espanol", { href: "/api/mcp" }],
  ])("no intercepta %s", (_label, attrs) => {
    expect(transitionTarget(PLAIN_CLICK, link(attrs), CURRENT)).toBeNull();
  });

  it("no intercepta un ancla de la misma pagina ni el mismo URL", () => {
    expect(transitionTarget(PLAIN_CLICK, link({ href: "#faq" }), CURRENT)).toBeNull();
    expect(transitionTarget(PLAIN_CLICK, link({ href: "/servicios?x=1#faq" }), CURRENT)).toBeNull();
    expect(transitionTarget(PLAIN_CLICK, link({ href: "/servicios?x=1" }), CURRENT)).toBeNull();
  });

  it("si cambia solo la busqueda sigue siendo otra pagina y se intercepta", () => {
    expect(transitionTarget(PLAIN_CLICK, link({ href: "/servicios?x=2" }), CURRENT)).not.toBeNull();
  });

  it("acepta target _self de forma explicita", () => {
    expect(transitionTarget(PLAIN_CLICK, link({ href: "/trabajo", target: "_self" }), CURRENT)).not.toBeNull();
  });
});

describe("pigmentFor", () => {
  const PIGMENTS = [{ path: "/servicios/motion", family: "periwinkle" as const }];

  // La cortina dice adonde vas: en ingles y en una subruta sigue siendo motion, y una
  // ruta que solo empieza igual no lo es.
  it("da la familia del destino en los dos idiomas y en sus subrutas, y null fuera", () => {
    expect(pigmentFor("/servicios/motion", PIGMENTS)).toBe("periwinkle");
    expect(pigmentFor("/en/servicios/motion", PIGMENTS)).toBe("periwinkle");
    expect(pigmentFor("/servicios/motion/caso", PIGMENTS)).toBe("periwinkle");
    expect(pigmentFor("/servicios/motionx", PIGMENTS)).toBeNull();
    expect(pigmentFor("/trabajo", PIGMENTS)).toBeNull();
  });
});
