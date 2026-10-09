import { describe, expect, it } from "vitest";
import type { Media } from "@/payload-types";
import { toSiteImage } from "./media";

const MEDIA = {
  id: 1,
  url: "https://cdn.test/pigmento/media/textura.jpg",
  width: 2560,
  height: 2090,
  alt: "Textura de chocolate derretido",
} as Media;

describe("toSiteImage", () => {
  it("toma la url y las medidas del documento", () => {
    expect(toSiteImage(MEDIA)).toEqual({
      src: "https://cdn.test/pigmento/media/textura.jpg",
      alt: "Textura de chocolate derretido",
      width: 2560,
      height: 2090,
    });
  });

  /**
   * Las medidas no se escriben a mano en ningun sitio: `next/image` las necesita para
   * reservar el hueco antes de descargar, y una inventada hace saltar la pagina al
   * llegar el archivo. Sin ellas se prefiere no pintar.
   */
  it("sin medidas no hay imagen", () => {
    expect(toSiteImage({ ...MEDIA, width: null } as Media)).toBeNull();
    expect(toSiteImage({ ...MEDIA, height: null } as Media)).toBeNull();
    expect(toSiteImage({ ...MEDIA, url: null } as Media)).toBeNull();
  });

  /** Una busqueda por nombre que no encuentra nada devuelve la lista vacia. */
  it("sin documento no hay imagen", () => {
    expect(toSiteImage(undefined)).toBeNull();
  });

  /**
   * El alt se LOCALIZA, y el tipo generado no lo sabe: `Media['alt']` es `string` a
   * secas porque el campo es obligatorio, pero obligatorio lo es en el idioma en que
   * se guardo. Pedido en el otro vuelve vacio, y vacio significa decorativa — que
   * para una banda de fondo es lo correcto. Lo que no se hace es inventar la
   * descripcion de una imagen que nadie miro.
   */
  it("sin traducir, la imagen queda decorativa", () => {
    expect(toSiteImage({ ...MEDIA, alt: "" })?.alt).toBe("");
  });
});
