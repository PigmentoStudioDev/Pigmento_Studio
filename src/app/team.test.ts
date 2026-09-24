import { describe, expect, it } from "vitest";
import type { TeamMember } from "@/design-system/components/organisms/Team/Team";
import { getTeam } from "./team";

/** Devuelve la clave y, detras, los valores que se le pasaron: asi se ve que llegaron. */
const t = (key: string, values?: Record<string, string>) =>
  values ? `${key} ${Object.values(values).join(" ")}` : key;

const MEMBER: TeamMember = {
  name: "Ana Ruiz",
  role: "Dirección de arte",
  group: "direccion",
  photo: { src: "/a.jpg", width: 800, height: 1000 },
  links: [],
};

describe("getTeam", () => {
  /** Sin personas publicadas no hay seccion: no se inventa a nadie para rellenarla. */
  it("sin miembros no devuelve seccion", () => {
    expect(getTeam(t, [])).toBeNull();
  });

  it("pasa los miembros tal cual y arma los textos del bloque", () => {
    const team = getTeam(t, [MEMBER]);

    expect(team?.members).toEqual([MEMBER]);
    expect(team?.title).toBe("title");
    expect(team?.labels.groups.diseno).toBe("groups.diseno");
    expect(team?.labels.networks.linkedin).toBe("networks.linkedin");
  });

  /**
   * Las plantillas llegan con sus huecos intactos: el nombre lo pone el componente por
   * tarjeta, y un hueco consumido aqui dejaria "Leer mas sobre " sin nadie.
   */
  it("las plantillas conservan los huecos del nombre y la red", () => {
    const labels = getTeam(t, [MEMBER])?.labels;

    expect(labels?.open).toContain("{name}");
    expect(labels?.link).toContain("{name}");
    expect(labels?.link).toContain("{network}");
  });
});
