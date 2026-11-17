import { describe, expect, it } from "vitest";
import type { WorkProject } from "@/cms/projects";
import { getApproach } from "./about";

const t = (key: string) => key;
const piece = (src: string) => ({ src, alt: "", width: 10, height: 10 });
const project = (slug: string) => ({ slug, title: slug, client: slug, image: piece(`/${slug}.jpg`) }) as WorkProject;

describe("getApproach", () => {
  it("toma las imagenes de las portadas, en el orden del CMS", () => {
    const items = getApproach(t, [project("uno"), project("dos"), project("tres")]);

    expect(items.map((item) => item.image?.src)).toEqual(["/uno.jpg", "/dos.jpg", "/tres.jpg"]);
  });

  it("sin proyectos suficientes la columna queda sin imagen, no con una inventada", () => {
    const items = getApproach(t, [project("uno")]);

    expect(items).toHaveLength(3);
    expect(items[1].image).toBeUndefined();
  });
});
