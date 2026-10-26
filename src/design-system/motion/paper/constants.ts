// Numeros del papel en un solo lugar: el shader solo ve uniforms.

/** Tope de densidad: el papel es grano fino y por encima de 1.5 el fill no se nota. */
export const MAX_DPR = 1.5;
/** En contenedores anchos el buffer crece con el area; se baja un poco mas. */
export const WIDE_DPR = 1.25;
export const WIDE_CONTAINER_PX = 1920;

/** La estela vive a 1/8 de la resolucion: es un campo suave, no necesita mas. */
export const SIM_DOWNSCALE = 8;

export const TRAIL = {
  /** Fraccion del camino hacia el puntero por frame a 60 Hz: 1 - .86^n. */
  follow: 0.14,
  /** Fuerza que suma cada px/ms de velocidad del puntero, y su tope. */
  forcePerSpeed: 0.05,
  maxForce: 0.35,
  /** Decaimiento de la fuerza por frame a 60 Hz. */
  forceDecay: 0.82,
  /** El shader recibe la fuerza escalada: el splat suma poco por frame y se acumula. */
  splatGain: 0.1,
  /** Radio del splat en unidades del alto del contenedor; crece con la fuerza. */
  radius: 0.085,
  radiusGrowth: 1.5,
  /** Cuanto se aplana el splat en la direccion del movimiento: estela alargada. */
  anisotropy: 0.65,
  /** Suavizado de la direccion por evento, y movimiento minimo en px para tocarla. */
  dirFollow: 0.2,
  dirMinPx: 0.5,
  /** Difusion con los 4 vecinos y desvanecido por paso de la sim. */
  diffusion: 0.6,
  fade: 0.94,
  /** Por debajo de esto la estela cuenta como quieta. */
  restForce: 0.004,
} as const;

/** Frames quietos seguidos antes de soltar el ticker: el GPU queda en cero en reposo. */
export const QUIET_FRAMES = 55;

/** Un frame largo (tab en segundo plano) no debe avanzar la sim de golpe. */
export const MAX_STEP_MS = 50;

/** Fraccion del scroll que recorre el papel: se mueve, pero mucho mas lento que el contenido. */
export const PARALLAX = 0.06;

export const RIPPLE = {
  /** Slots de uniform; uno siempre queda para el anillo que se apaga. */
  slots: 6,
  gapMs: 150,
  durationMs: 1900,
  alpha: 0.85,
  /** Fraccion final de la vida en la que el alpha cae a cero (curva cuadratica). */
  tail: 0.3,
  /** Apagado del anillo mas viejo cuando llega uno nuevo y no hay slot. */
  dieMs: 220,
  /** Margen sobre la esquina mas lejana, en fraccion del alto del contenedor. */
  overshoot: 0.08,
} as const;

/** Interactivos donde el clic es del control, no del papel. */
export const RIPPLE_IGNORE = 'a, button, input, label, select, textarea, [role="button"], [data-no-pulse]';

export const PULSE = {
  minGapMs: 2000,
  maxGapMs: 3300,
  durationMs: 1100,
  /** Fracciones de subida y bajada de la envolvente; el resto es meseta. */
  ramp: 0.3,
  /** El shake avanza a saltos de 8 Hz: stop motion, no un temblor continuo. */
  stepHz: 8,
} as const;

export const RETINT_MS = 400;

/** Pitch de la trama a 45 grados, en px CSS: la imprime todo el tono de la hoja. */
export const HALFTONE_PITCH_PX = 6;

/**
 * Pesos de cada capa de la hoja (numeros del RE de carterogunsola.com). El shader los
 * recibe ya resueltos por modo, mezclados con la oscuridad del papel para que el
 * retint tambien cambie el caracter del grano y no solo el color.
 */
export const PAPER_WEIGHTS = {
  tooth: 0.055,
  felt: 0.035,
  crumple: 0.0038,
  emboss: 0.9,
  warp: 0.16,
  streak1: 0.018,
  streak2: 0.014,
  stain: 0.022,
  crease: 0.58,
  edge: 1,
  sheen: 0.03,
  halftone: 0.6,
  fleck: 0.14,
  halfTrail: 0.35,
  wakeDots: 0.4,
  pulse: 0.5,
} as const;

/** En oscuro el papel muestra mas diente y menos mancha; las lineas se apagan un poco. */
export const DARK_STOCK = {
  strength: 0.68,
  lines: 0.8,
  tooth: 1.6,
  felt: 0.45,
  crumple: 0.6,
  halftone: 0.45,
} as const;

/** Amplitud del shake del pulse, en unidades del alto del contenedor. */
export const PULSE_GAIN = 0.006;

/**
 * El papel toma el fondo y la tinta de la ZONA donde vive, no de un token propio: la
 * placa de contacto invierte el tema, y leer los roles de Carbon en el contenedor da
 * papel oscuro en la placa oscura y claro en la clara sin que nadie se lo diga.
 */
export const PAPER_TOKENS = { paper: '--cds-background', ink: '--cds-text-primary' } as const;

/** Si el token no llega (hoja sin cargar), estos son los del modo claro. */
export const FALLBACK_COLORS = { paper: [214, 214, 213], ink: [30, 30, 30] } as const;

export const PAPER_RETREAT_KEY = 'pg-paper-retreat';

/** Cuando el equipo no puede con el papel, el gobernador lo retira por la sesion. */
export const GOVERNOR = {
  /** Frames seguidos por encima de longFrameMs que delatan un equipo que no puede. */
  longFrameMs: 100,
  longFrameStreak: 8,
  /** Ventana de muestreo: no se juzga antes de minWindowMs y se reinicia en maxWindowMs. */
  slowFrameMs: 32,
  slowFrameShare: 0.25,
  minWindowMs: 2000,
  maxWindowMs: 5000,
} as const;
