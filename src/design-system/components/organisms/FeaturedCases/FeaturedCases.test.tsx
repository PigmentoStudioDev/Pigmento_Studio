import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";
import { FeaturedCases } from "./FeaturedCases";
import styles from "./FeaturedCases.module.scss";

const PIEZAS = [
  { src: "/caso/01.jpg", width: 800, height: 1000 },
  { src: "/caso/02.jpg", width: 800, height: 1000 },
];

const CASOS = [
  {
    client: "Señora Galleta",
    discipline: "Branding",
    summary: "El reto fue construir una identidad capaz de transmitir sofisticacion sin perder cercania.",
    pieces: PIEZAS,
  },
  {
    client: "Mont Blanc",
    summary: "Un sitio que tenia que sostener catalogo, tienda y blog sin tres plantillas distintas.",
    pieces: [PIEZAS[0]],
  },
];

const LABELS = {
  previous: "Caso anterior",
  next: "Caso siguiente",
  slider: "Casos",
  drag: "Arrastra",
};

const PROPS = { label: "El caso", cases: CASOS, labels: LABELS };

const tarjetas = () => screen.getAllByRole("listitem").filter((li) => li.className === styles.card);
const activa = () => tarjetas().find((card) => card.getAttribute("aria-current") === "true");

describe("FeaturedCases", () => {
  /** El nombre de cada caso ES el titular de su tarjeta: es lo que la nombra al escucharla. */
  it("cada caso lleva su cliente como titular", () => {
    render(<FeaturedCases {...PROPS} />);

    expect(screen.getByRole("heading", { level: 2, name: "Señora Galleta" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Mont Blanc" })).toBeInTheDocument();
  });

  it("pinta el texto del caso y su disciplina", () => {
    render(<FeaturedCases {...PROPS} />);

    expect(screen.getByText(/identidad capaz de transmitir/)).toBeInTheDocument();
    expect(screen.getByText("Branding")).toBeInTheDocument();
  });

  /** La disciplina es opcional: un caso puede no tenerla y su tarjeta sigue en pie. */
  it("un caso sin disciplina se pinta igual", () => {
    render(<FeaturedCases {...PROPS} />);

    const segunda = tarjetas()[1];
    expect(within(segunda).getByRole("heading", { level: 2 })).toHaveTextContent("Mont Blanc");
    expect(within(segunda).queryByText("Branding")).not.toBeInTheDocument();
  });

  /**
   * Las piezas son decorativas: la tarjeta ya esta nombrada por el cliente y descrita
   * por su texto, y describir una a una las piezas de una identidad repite lo dicho.
   */
  it("las piezas no se anuncian una a una", () => {
    render(<FeaturedCases {...PROPS} />);

    expect(screen.queryAllByRole("img")).toHaveLength(0);
  });

  /**
   * El id del landmark nombra la SECCION, y un id se usa una vez: va en el primer
   * caso, no en cada tarjeta.
   */
  it("el id de la seccion va una sola vez", () => {
    const { container } = render(<FeaturedCases {...PROPS} titleId="caso" />);

    expect(container.querySelectorAll("#caso")).toHaveLength(1);
  });

  it("la flecha avanza de caso", async () => {
    const user = userEvent.setup();
    render(<FeaturedCases {...PROPS} />);

    expect(activa()).toHaveTextContent("Señora Galleta");
    await user.click(screen.getByRole("button", { name: LABELS.next }));
    expect(activa()).toHaveTextContent("Mont Blanc");
  });

  /** En el primer caso no hay nada detras, y el control lo dice en vez de no hacer nada. */
  it("la flecha de atras llega apagada", () => {
    render(<FeaturedCases {...PROPS} />);

    expect(screen.getByRole("button", { name: LABELS.previous })).toBeDisabled();
    expect(screen.getByRole("button", { name: LABELS.next })).toBeEnabled();
  });

  /**
   * Con un solo caso las dos flechas estarian apagadas, y un control que solo dice que
   * no se puede usar es ruido.
   */
  it("con un caso no hay flechas", () => {
    render(<FeaturedCases {...PROPS} cases={[CASOS[0]]} />);

    expect(screen.queryByRole("button", { name: LABELS.next })).not.toBeInTheDocument();
    expect(tarjetas()).toHaveLength(1);
  });

  /** Sin casos no hay bloque: la pagina lo decide antes, pero el componente no se cuelga. */
  it("sin casos no se pinta", () => {
    const { container } = render(<FeaturedCases {...PROPS} cases={[]} />);

    expect(container).toBeEmptyDOMElement();
  });

  /** Dos casos del mismo cliente no colisionan: la clave lleva la posicion. */
  it("dos casos del mismo cliente se pintan los dos", () => {
    render(<FeaturedCases {...PROPS} cases={[CASOS[0], CASOS[0]]} />);

    expect(tarjetas()).toHaveLength(2);
  });

  it("toda clase que pide el TSX existe en la hoja", () => {
    const usadas = [
      "root",
      "controls",
      "previous",
      "viewport",
      "track",
      "card",
      "text",
      "label",
      "discipline",
      "summary",
      "gallery",
      "piece",
      "image",
    ];
    for (const c of usadas) expect(styles[c], `styles.${c}`).toBeDefined();
    expect(Object.keys(styles)).toHaveLength(usadas.length);
  });

  it("no tiene violaciones de accesibilidad", async () => {
    const { container } = render(<FeaturedCases {...PROPS} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
