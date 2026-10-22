import { describe, expect, it } from "vitest";
import { faqJsonLd } from "./faq";

describe("faqJsonLd", () => {
  it("escapa < para que una respuesta no pueda cerrar la etiqueta script", () => {
    const html = faqJsonLd([{ question: "¿Precio?", answer: "</script><b>x</b>" }]);

    expect(html).not.toContain("<");
    expect(JSON.parse(html).mainEntity[0]).toEqual({
      "@type": "Question",
      name: "¿Precio?",
      acceptedAnswer: { "@type": "Answer", text: "</script><b>x</b>" },
    });
  });
});
