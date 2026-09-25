import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";
import { themeZoneClass } from "../../../theme/zone";
import { Team, type TeamProps } from "./Team";

const PHOTO = { src: "/portfolio/02.png", width: 522, height: 715 };

const PROPS: TeamProps = {
  title: "Equipo",
  label: "Quién lo hace",
  intro: "Un estudio pequeño.",
  members: [
    {
      name: "Ana Ruiz",
      role: "Dirección de arte",
      group: "direccion",
      bio: "Dirige cada proyecto de principio a fin.",
      photo: PHOTO,
      links: [{ network: "linkedin", url: "https://www.linkedin.com/in/ana" }],
    },
    { name: "Luis Vega", role: "Diseño de marca", group: "diseno", photo: PHOTO, links: [] },
    { name: "Mar Soto", role: "Motion", group: "diseno", photo: PHOTO, links: [] },
  ],
  labels: {
    groups: { all: "Todos", direccion: "Dirección", diseno: "Diseño", desarrollo: "Desarrollo", estrategia: "Estrategia" },
    filter: "Filtrar por área",
    previous: "Persona anterior",
    next: "Persona siguiente",
    open: "Leer más sobre {name}",
    close: "Cerrar",
    link: "{name} en {network}",
    networks: { linkedin: "LinkedIn", instagram: "Instagram", behance: "Behance", x: "X", web: "sitio web" },
    roster: "Equipo, usa las flechas",
    drag: "Arrastra",
  },
  titleId: "equipo",
};

const cards = () => within(screen.getByRole("list")).getAllByRole("listitem");
const active = () => cards().find((card) => card.getAttribute("aria-current") === "true");

describe("Team", () => {
  it("presenta a cada persona con su oficio y su retrato", () => {
    render(<Team {...PROPS} />);

    expect(screen.getByRole("img", { name: "Ana Ruiz" })).toBeInTheDocument();
    expect(screen.getAllByText("Dirección de arte").length).toBeGreaterThan(0);
    expect(cards()).toHaveLength(3);
  });

  /** Solo se ofrece un area que tenga a alguien: una pastilla que filtra a cero es un callejon. */
  it("ofrece Todos y solo las areas con personas", () => {
    render(<Team {...PROPS} />);

    const filters = within(screen.getByRole("group", { name: "Filtrar por área" }));

    expect(filters.getAllByRole("button").map((b) => b.textContent)).toEqual(["Todos", "Dirección", "Diseño"]);
    expect(filters.getByRole("button", { name: "Todos" })).toHaveAttribute("aria-pressed", "true");
  });

  it("una pastilla filtra la fila y se marca como pulsada", async () => {
    const user = userEvent.setup();
    render(<Team {...PROPS} />);

    await user.click(screen.getByRole("button", { name: "Diseño" }));

    expect(screen.getByRole("button", { name: "Diseño" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Todos" })).toHaveAttribute("aria-pressed", "false");
    expect(cards().map((card) => within(card).getByRole("img").getAttribute("alt"))).toEqual(["Luis Vega", "Mar Soto"]);
  });

  it("las flechas de la barra mueven a la persona activa y se apagan en los extremos", async () => {
    const user = userEvent.setup();
    render(<Team {...PROPS} />);

    expect(active()).toHaveTextContent("Ana Ruiz");
    expect(screen.getByRole("button", { name: "Persona anterior" })).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Persona siguiente" }));
    await user.click(screen.getByRole("button", { name: "Persona siguiente" }));

    expect(active()).toHaveTextContent("Mar Soto");
    expect(screen.getByRole("button", { name: "Persona siguiente" })).toBeDisabled();
  });

  it("con el foco en la fila, las flechas del teclado la recorren", () => {
    render(<Team {...PROPS} />);

    const roster = screen.getByRole("group", { name: "Equipo, usa las flechas" });
    roster.focus();
    fireEvent.keyDown(roster, { key: "ArrowRight" });

    expect(active()).toHaveTextContent("Luis Vega");

    fireEvent.keyDown(roster, { key: "ArrowLeft" });
    expect(active()).toHaveTextContent("Ana Ruiz");
  });

  /**
   * El panel se abre sobre la foto y el foco entra en el; al cerrarlo vuelve al boton que
   * lo abrio. Sin eso quien navega con teclado se queda en un sitio que ya no existe.
   */
  it("el panel se abre, se cierra con Escape y devuelve el foco", async () => {
    const user = userEvent.setup();
    render(<Team {...PROPS} />);

    const open = screen.getByRole("button", { name: "Leer más sobre Ana Ruiz" });
    expect(open).toHaveAttribute("aria-expanded", "false");

    await user.click(open);

    expect(open).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Dirige cada proyecto de principio a fin.")).toBeVisible();
    expect(screen.getByRole("button", { name: "Cerrar" })).toHaveFocus();

    await user.keyboard("{Escape}");

    expect(open).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("button", { name: "Cerrar" })).not.toBeInTheDocument();
    expect(open).toHaveFocus();
  });

  it("el boton de cerrar tambien lo cierra", async () => {
    const user = userEvent.setup();
    render(<Team {...PROPS} />);

    const open = screen.getByRole("button", { name: "Leer más sobre Ana Ruiz" });
    await user.click(open);
    await user.click(screen.getByRole("button", { name: "Cerrar" }));

    expect(open).toHaveAttribute("aria-expanded", "false");
    expect(open).toHaveFocus();
  });

  /**
   * El velo es oscuro en los dos modos, asi que el panel tiene que ser zona oscura: sin
   * ella, en modo claro el boton de cerrar toma los tokens del claro y queda oscuro
   * sobre oscuro.
   */
  it("el panel es zona oscura en cualquier modo", async () => {
    const user = userEvent.setup();
    render(<Team {...PROPS} />);

    await user.click(screen.getByRole("button", { name: "Leer más sobre Ana Ruiz" }));
    const close = screen.getByRole("button", { name: "Cerrar" });

    expect(close.closest(`.${themeZoneClass("g100")}`)).not.toBeNull();
  });

  it("un clic fuera de la tarjeta cierra el panel", async () => {
    const user = userEvent.setup();
    render(<Team {...PROPS} />);

    const open = screen.getByRole("button", { name: "Leer más sobre Ana Ruiz" });
    await user.click(open);
    await user.click(screen.getByRole("heading", { name: "Equipo" }));

    expect(open).toHaveAttribute("aria-expanded", "false");
  });

  it("cada enlace dice de quien es y a que red lleva", () => {
    render(<Team {...PROPS} />);

    expect(screen.getByRole("link", { name: "Ana Ruiz en LinkedIn" })).toHaveAttribute(
      "href",
      "https://www.linkedin.com/in/ana",
    );
  });

  it("no tiene violaciones de accesibilidad", async () => {
    const { container } = render(<Team {...PROPS} />);

    expect(await axe(container)).toHaveNoViolations();
  });
});
