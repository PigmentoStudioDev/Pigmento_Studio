import { themeModeClass, type ThemeMode } from "./zone";

/**
 * La preferencia de modo: un store externo, no un contexto de React.
 *
 * Es externo por tres razones que un contexto no cubre. La preferencia se lee y se
 * escribe ANTES de que React exista — el script de abajo corre en el <head> para
 * que la primera pintura ya salga en el modo correcto. La escribe tambien el
 * sistema operativo, por un listener de matchMedia que no vive en ningun arbol. Y
 * la leen piezas que no comparten ancestro: la cabecera y el conmutador estan en
 * ramas distintas del layout.
 *
 * `useSyncExternalStore` es entonces la lectura correcta desde React: da el
 * snapshot del servidor por separado, que es justo lo que hace falta cuando el
 * valor real solo existe en el navegador.
 */

/**
 * No lleva prefijo `pg-` a proposito: ese prefijo es el de las clases globales y
 * el contrato de estructura lo persigue en el TSX. Una clave de almacenamiento que
 * se parece a una clase es una falsa alarma esperando.
 */
export const THEME_STORAGE_KEY = "pigmento-theme";

const DARK_QUERY = "(prefers-color-scheme: dark)";

const listeners = new Set<() => void>();

/**
 * El servidor no tiene preferencia que leer, y fingir una es peor que no tenerla:
 * si el HTML sale en oscuro y la persona tiene claro, se ve el cambio. Claro es el
 * snapshot de servidor porque es el que el CSS ya pinta sin ninguna clase.
 */
const SERVER_MODE: ThemeMode = "light";

let current: ThemeMode | null = null;

function stored(): ThemeMode | null {
  try {
    const value = localStorage.getItem(THEME_STORAGE_KEY);
    return value === "dark" || value === "light" ? value : null;
  } catch {
    // Modo privado de Safari y navegadores con el almacenamiento bloqueado: tirar
    // aqui dejaria el sitio entero sin tema, que es mucho peor que no recordar.
    return null;
  }
}

function preferred(): ThemeMode {
  return stored() ?? (window.matchMedia(DARK_QUERY).matches ? "dark" : "light");
}

/** Deja en <html> exactamente una de las dos clases de modo. */
function paint(mode: ThemeMode) {
  const root = document.documentElement;
  root.classList.remove(themeModeClass("light"), themeModeClass("dark"));
  root.classList.add(themeModeClass(mode));
}

export function getThemeMode(): ThemeMode {
  if (typeof window === "undefined") return SERVER_MODE;
  current ??= preferred();
  return current;
}

export function getServerThemeMode(): ThemeMode {
  return SERVER_MODE;
}

export function setThemeMode(mode: ThemeMode) {
  current = mode;
  paint(mode);

  try {
    localStorage.setItem(THEME_STORAGE_KEY, mode);
  } catch {
    // Sin persistencia el modo sigue aplicado en esta pestana. Se pierde al
    // recargar, y esa es toda la consecuencia.
  }

  listeners.forEach((listener) => listener());
}

export function subscribeThemeMode(listener: () => void): () => void {
  listeners.add(listener);

  // El sistema tambien cambia el modo, y solo mientras nadie haya elegido: en
  // cuanto hay preferencia guardada, mandar sobre ella seria deshacer una decision
  // que la persona ya tomo.
  const media = window.matchMedia(DARK_QUERY);
  const onSystemChange = () => {
    if (stored() !== null) return;
    current = media.matches ? "dark" : "light";
    paint(current);
    listeners.forEach((l) => l());
  };

  media.addEventListener("change", onSystemChange);

  return () => {
    listeners.delete(listener);
    media.removeEventListener("change", onSystemChange);
  };
}

/**
 * El script anti-parpadeo, para el <head>.
 *
 * Corre sincrono antes de la primera pintura: sin el, el documento sale con la
 * clase clara del servidor y salta a oscuro al hidratar. Ese salto se ve, y se ve
 * justo en quien eligio oscuro.
 *
 * Los nombres de clase se INTERPOLAN desde themeModeClass en vez de escribirse en
 * la plantilla. Asi la convencion `cds--` sigue viviendo solo en zone.ts — que es
 * el unico archivo exento de la regla — y este script no puede quedarse apuntando
 * a una clase que el CSS dejo de emitir.
 */
export function themeModeScript(): string {
  const light = JSON.stringify(themeModeClass("light"));
  const dark = JSON.stringify(themeModeClass("dark"));
  const key = JSON.stringify(THEME_STORAGE_KEY);
  const query = JSON.stringify(DARK_QUERY);

  return (
    `(function(){var c=${light};try{var s=localStorage.getItem(${key});` +
    `if(s==="dark"||(s!=="light"&&matchMedia(${query}).matches))c=${dark};}catch(e){}` +
    `document.documentElement.classList.add(c);})()`
  );
}
