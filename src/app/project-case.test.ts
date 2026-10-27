import { describe, expect, it } from "vitest";
import type { ProjectPiece, WorkProject } from "@/cms/projects";
import { compose, STACK_CAP } from "./case-composition";
import { buildProjectCase, nextProject } from "./project-case";

const wide = (n: number): ProjectPiece => ({ src: `/w${n}.jpg`, alt: `w${n}`, width: 1600, height: 900 });
const tall = (n: number): ProjectPiece => ({ src: `/t${n}.jpg`, alt: `t${n}`, width: 800, height: 1000 });
const work = (slug: string): WorkProject => ({ slug, title: slug, client: slug, image: wide(0) });

describe("compose", () => {
  // Una vertical a sangre ocupa tres pantallas: la orientacion decide la composicion.
  it("dos verticales hacen par, horizontal y vertical el par asimetrico alternando lado, y una horizontal sola alterna a sangre e inset", () => {
    const groups = compose([tall(1), tall(2), wide(1), tall(3), tall(4), wide(2), wide(3), wide(4)]);

    expect(groups.map((group) => group.layout)).toEqual(["pair", "offset", "offsetMirror", "wide", "inset"]);
    expect(compose([tall(9)])[0].layout).toBe("single");
    expect(groups[1].pieces.map((piece) => piece.frame)).toEqual(["classic", "portrait"]);
    expect(groups[2].pieces[0].src).toBe("/w2.jpg");
  });
});

describe("buildProjectCase", () => {
  it("lo que ningun capitulo pidio va primero a los capitulos sin piezas, y lo que pasa del tope a la tira", () => {
    const gallery = Array.from({ length: STACK_CAP + 6 }, (_, n) => wide(n));
    const built = buildProjectCase(gallery, {
      chapters: [
        { key: "a", title: "A", paragraphs: [], media: [0, 0, 99] },
        { key: "b", title: "B", paragraphs: [] },
      ],
    });

    expect(built.chapters[0].media.flatMap((group) => group.pieces.map((piece) => piece.src))).toEqual(["/w0.jpg"]);
    expect(built.chapters[1].media.flatMap((group) => group.pieces.map((piece) => piece.src))).toEqual(["/w1.jpg"]);
    expect(built.gallery.flatMap((group) => group.pieces)).toHaveLength(STACK_CAP);
    expect(built.strip.map((piece) => piece.src)).toEqual(
      gallery.slice(2 + STACK_CAP).map((piece) => piece.src),
    );
  });
});

describe("nextProject", () => {
  it("tras el ultimo vuelve al primero, y sin otro caso no hay siguiente", () => {
    expect(nextProject([work("a"), work("b")], "b")?.slug).toBe("a");
    expect(nextProject([work("a")], "a")).toBeUndefined();
  });
});
