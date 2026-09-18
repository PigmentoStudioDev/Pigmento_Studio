import { describe, expect, it } from "vitest";
import { cursorAttributes, cursorState, readCursorTarget, rotationFromDelta } from "./cursor";

function tree(html: string): HTMLElement {
  const root = document.createElement("div");
  root.innerHTML = html;
  return root;
}

describe("readCursorTarget", () => {
  it("sin atributo es la flecha", () => {
    const root = tree(`<p><span id="x">texto</span></p>`);

    expect(readCursorTarget(root.querySelector("#x"))).toEqual({ variant: "default", text: "", element: null });
  });

  it("gana el ancestro mas cercano y trae su texto", () => {
    const root = tree(`<a data-cursor="scramble" data-cursor-text="Ver caso"><img id="x" /></a>`);
    const target = readCursorTarget(root.querySelector("#x"));

    expect(target.variant).toBe("scramble");
    expect(target.text).toBe("Ver caso");
    expect(target.element).toBe(root.querySelector("a"));
  });

  it("default dentro de otra variante vuelve a la flecha", () => {
    const root = tree(`<div data-cursor="scramble" data-cursor-text="Ver"><div data-cursor="default"><b id="x"></b></div></div>`);

    expect(readCursorTarget(root.querySelector("#x")).variant).toBe("default");
  });

  it("un valor que no es variante deja la flecha", () => {
    const root = tree(`<div data-cursor="scrambel"><b id="x"></b></div>`);

    expect(readCursorTarget(root.querySelector("#x")).variant).toBe("default");
  });

  it("sin nada bajo el puntero es la flecha", () => {
    expect(readCursorTarget(null).variant).toBe("default");
  });
});

describe("cursorState", () => {
  it("la flecha no activa la pastilla", () => {
    expect(cursorState("default", true)).toBe("");
  });

  it("la pastilla se voltea en el borde derecho", () => {
    expect(cursorState("scramble", false)).toBe("active");
    expect(cursorState("scramble", true)).toBe("active-edge");
  });
});

describe("cursorState · arrastre", () => {
  it("el disco va centrado en el puntero, asi que el borde no lo voltea", () => {
    expect(cursorState("drag", false)).toBe("active");
    expect(cursorState("drag", true)).toBe("active");
  });
});

describe("rotationFromDelta", () => {
  it("la punta sigue la direccion del movimiento", () => {
    expect(rotationFromDelta(0, -1)).toBe(0);
    expect(rotationFromDelta(1, 0)).toBe(90);
  });
});

describe("cursorAttributes", () => {
  it("publica la variante y, si hay, su texto", () => {
    expect(cursorAttributes("scramble", "Ver caso")).toEqual({ "data-cursor": "scramble", "data-cursor-text": "Ver caso" });
    expect(cursorAttributes("default")).toEqual({ "data-cursor": "default" });
  });
});
