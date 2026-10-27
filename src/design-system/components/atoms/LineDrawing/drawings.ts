/**
 * Los dibujos de linea del sitio, como lista de trazos. Cada uno se pinta como
 * un <path> con `pathLength={1}`: asi la hoja dibuja todos con el mismo dasharray sin
 * medir cada uno, y el orden de la lista ES el orden en que se dibujan.
 *
 * Solo trazos de path, nunca <rect> ni <circle>: pathLength en formas basicas no es
 * fiable en todos los motores, y un trazo que no lo respeta se queda a medio dibujar.
 *
 * Toda caja va con la esquina redondeada: el sitio no tiene una sola esquina viva, y
 * un rectangulo recto dentro de una tarjeta redonda se leia como un plano tecnico.
 */
export type LineDrawingName =
  | "branding"
  | "web"
  | "motion"
  | "marketing"
  | "work"
  | "studio"
  | "direct"
  | "tested"
  | "sameTable"
  | "lasting"
  | "measured";

export const LINE_DRAWINGS: Record<LineDrawingName, readonly string[]> = {
  // La reticula de construccion de una marca: el cuadro, el circulo inscrito, las
  // diagonales, los ejes y el nucleo.
  branding: [
    "M40 30H120A10 10 0 0 1 130 40V120A10 10 0 0 1 120 130H40A10 10 0 0 1 30 120V40A10 10 0 0 1 40 30Z",
    "M130 80A50 50 0 1 1 30 80A50 50 0 1 1 130 80",
    "M30 30L130 130",
    "M130 30L30 130",
    "M80 20V140",
    "M20 80H140",
    "M105 80A25 25 0 1 1 55 80A25 25 0 1 1 105 80",
  ],
  // Una ventana de navegador: el marco, la barra, sus tres puntos y el contenido.
  web: [
    "M30 34H130A10 10 0 0 1 140 44V116A10 10 0 0 1 130 126H30A10 10 0 0 1 20 116V44A10 10 0 0 1 30 34Z",
    "M20 52H140",
    "M32.5 43A2.5 2.5 0 1 1 27.5 43A2.5 2.5 0 1 1 32.5 43",
    "M41.5 43A2.5 2.5 0 1 1 36.5 43A2.5 2.5 0 1 1 41.5 43",
    "M50.5 43A2.5 2.5 0 1 1 45.5 43A2.5 2.5 0 1 1 50.5 43",
    "M36 64H72A4 4 0 0 1 76 68V110A4 4 0 0 1 72 114H36A4 4 0 0 1 32 110V68A4 4 0 0 1 36 64Z",
    "M88 68H128",
    "M88 80H128",
    "M88 92H116",
    "M92 106H104A4 4 0 0 1 108 110V110A4 4 0 0 1 104 114H92A4 4 0 0 1 88 110V110A4 4 0 0 1 92 106Z",
  ],
  // Una curva de aceleracion: los ejes, la curva y sus dos tiradores.
  motion: [
    "M28 28V132H132",
    "M28 132C100 128 60 32 132 28",
    "M28 132L100 128",
    "M132 28L60 32",
    "M103 128A3 3 0 1 1 97 128A3 3 0 1 1 103 128",
    "M63 32A3 3 0 1 1 57 32A3 3 0 1 1 63 32",
  ],
  // Barras que crecen y la tendencia que las cruza.
  marketing: [
    "M24 132H136",
    "M34 132V107A3 3 0 0 1 37 104H49A3 3 0 0 1 52 107V132",
    "M62 132V89A3 3 0 0 1 65 86H77A3 3 0 0 1 80 89V132",
    "M90 132V67A3 3 0 0 1 93 64H105A3 3 0 0 1 108 67V132",
    "M118 132V43A3 3 0 0 1 121 40H133A3 3 0 0 1 136 43V132",
    "M30 96L58 78L86 56L126 26",
    "M114 26H126V38",
  ],
  // El portafolio: un marco delante con su paisaje y dos detras, asomando.
  work: [
    "M16 104V42A10 10 0 0 1 26 32H112",
    "M28 116V54A10 10 0 0 1 38 44H124",
    "M50 56H126A10 10 0 0 1 136 66V118A10 10 0 0 1 126 128H50A10 10 0 0 1 40 118V66A10 10 0 0 1 50 56Z",
    "M40 112L72 84L96 104L112 92L136 112",
    "M117 76A5 5 0 1 1 107 76A5 5 0 1 1 117 76",
  ],
  // El equipo: tres circulos que se cruzan. Pocas manos, un solo criterio en medio.
  studio: [
    "M98 66A36 36 0 1 1 26 66A36 36 0 1 1 98 66",
    "M134 66A36 36 0 1 1 62 66A36 36 0 1 1 134 66",
    "M116 98A36 36 0 1 1 44 98A36 36 0 1 1 116 98",
  ],
  // Trato directo: dos globos que se contestan sin nadie en medio.
  direct: [
    "M34 36H82A10 10 0 0 1 92 46V70A10 10 0 0 1 82 80H52L40 92V80H34A10 10 0 0 1 24 70V46A10 10 0 0 1 34 36Z",
    "M36 52H80",
    "M36 64H68",
    "M78 76H126A10 10 0 0 1 136 86V110A10 10 0 0 1 126 120H120V132L108 120H78A10 10 0 0 1 68 110V86A10 10 0 0 1 78 76Z",
    "M80 92H124",
    "M80 104H112",
  ],
  // Validacion: una lista que se va marcando, la ultima todavia abierta.
  tested: [
    "M34 32H46A6 6 0 0 1 52 38V50A6 6 0 0 1 46 56H34A6 6 0 0 1 28 50V38A6 6 0 0 1 34 32Z",
    "M33 44L39 50L48 37",
    "M64 44H132",
    "M34 68H46A6 6 0 0 1 52 74V86A6 6 0 0 1 46 92H34A6 6 0 0 1 28 86V74A6 6 0 0 1 34 68Z",
    "M33 80L39 86L48 73",
    "M64 80H124",
    "M34 104H46A6 6 0 0 1 52 110V122A6 6 0 0 1 46 128H34A6 6 0 0 1 28 122V110A6 6 0 0 1 34 104Z",
    "M64 116H112",
  ],
  // Diseno y codigo: las llaves del codigo y el trazo que las cruza.
  sameTable: [
    "M52 48L20 80L52 112",
    "M108 48L140 80L108 112",
    "M92 36L68 124",
  ],
  // Pensado para durar: un reloj de arena con la arena ya abajo.
  lasting: [
    "M44 24H116",
    "M44 136H116",
    "M52 24C52 60 76 68 76 80C76 92 52 100 52 136",
    "M108 24C108 60 84 68 84 80C84 92 108 100 108 136",
    "M62 136C66 120 94 120 98 136",
  ],
  // Resultados a la vista: un indicador con la aguja ya pasada la mitad.
  measured: [
    "M24 124H136",
    "M28 112A52 52 0 0 1 132 112",
    "M80 60V70",
    "M43 75L50 82",
    "M117 75L110 82",
    "M80 112L106 82",
    "M86 112A6 6 0 1 1 74 112A6 6 0 1 1 86 112",
  ],
};
