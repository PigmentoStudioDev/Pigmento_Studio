import { afterEach, describe, expect, it } from "vitest";
import { PAGE_STATUS, PRELOADER_SEEN_KEY, markPageReady, pageStatusScript, whenPageReady } from "./pageReady";

const html = () => document.documentElement;

describe("pageReady", () => {
  afterEach(() => {
    html().removeAttribute(PAGE_STATUS);
    sessionStorage.removeItem(PRELOADER_SEEN_KEY);
  });

  it("sin marca de loading resuelve al instante", async () => {
    await expect(whenPageReady()).resolves.toBeUndefined();
  });

  it("con marca de loading espera a markPageReady", async () => {
    html().setAttribute(PAGE_STATUS, "loading");

    let settled = false;
    const waiting = whenPageReady().then(() => {
      settled = true;
    });

    await Promise.resolve();
    expect(settled).toBe(false);

    markPageReady();
    await waiting;

    expect(settled).toBe(true);
    expect(html()).toHaveAttribute(PAGE_STATUS, "ready");
  });

  // El script corre antes de la primera pintura: tiene que ser JS valido sin modulos.
  it("el script inline marca loading solo la primera vez", () => {
    const run = () => new Function(pageStatusScript())();

    run();
    expect(html()).toHaveAttribute(PAGE_STATUS, "loading");

    html().removeAttribute(PAGE_STATUS);
    sessionStorage.setItem(PRELOADER_SEEN_KEY, "1");
    run();
    expect(html()).not.toHaveAttribute(PAGE_STATUS);
  });
});
