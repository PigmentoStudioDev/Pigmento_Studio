import { describe, expect, it } from "vitest";
import { sendContact } from "./contact-action";

const BASE = {
  name: "Ana Torres",
  email: "ana@empresa.com",
  phone: "",
  topic: "branding-e-identidad-visual",
  message: "Queremos renovar la identidad de la marca este ano.",
};

describe("sendContact", () => {
  it("acepta el tema de cualquier pagina de servicio y los campos extra de marketing", async () => {
    await expect(
      sendContact({ ...BASE, company: "Empresa", website: "empresa.com", goal: "incrementar-mis-ventas" }),
    ).resolves.toBeUndefined();
  });

  it("rechaza un tema o un objetivo que no tiene forma de identificador", async () => {
    await expect(sendContact({ ...BASE, topic: "<script>alert(1)</script>" })).rejects.toThrow();
    await expect(sendContact({ ...BASE, goal: "Otro objetivo libre" })).rejects.toThrow();
  });

  it("rechaza empresa o sitio por encima del tope", async () => {
    await expect(sendContact({ ...BASE, company: "x".repeat(201) })).rejects.toThrow();
  });
});
