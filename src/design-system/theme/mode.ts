import { themeModeClass, type ThemeMode } from "./zone";

/**
 * La preferencia de modo: un store externo, no un contexto de React.
 *
 * Es externo por tres razones que un contexto no cubre. La preferencia se lee y se
 * escribe ANTES de que React exista — el script de abajo corre en el <head> para
 * que la primera pintura ya salga en el modo correcto. Sobrevive a la recarga, en
 * localStorage, que tampoco vive en ningun arbol. Y la leen piezas que no comparten
 * ancestro: la cabecera y el conmutador estan en ramas distintas del layout.
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

/**
 * Claro es el modo del sitio, y el sistema operativo no lo decide.
 *
 * Hubo un tiempo en que caia a `prefers-color-scheme`, y eso hacia que la primera
 * pantalla de la mitad de las visitas fuera una que nadie habia disenado: el sitio
 * de un estudio de marca abre en la version que el estudio eligio, igual que un
 * impreso no cambia de papel segun quien lo abra. Quien prefiera oscuro lo tiene a
 * un clic en el conmutador, y a partir de ahi se recuerda.
 *
 * La consecuencia, escrita para que sea una decision y no un descuido: alguien con
 * el sistema en oscuro ve claro en su primera visita.
 */
const DEFAULT_MODE: ThemeMode = "light";

const listeners = new Set<() => void>();

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

/** Deja en <html> exactamente una de las dos clases de modo. */
function paint(mode: ThemeMode) {
  const root = document.documentElement;
  root.classList.remove(themeModeClass("light"), themeModeClass("dark"));
  root.classList.add(themeModeClass(mode));
}

export function getThemeMode(): ThemeMode {
  if (typeof window === "undefined") return DEFAULT_MODE;
  current ??= stored() ?? DEFAULT_MODE;
  return current;
}

/**
 * El servidor no tiene preferencia que leer, y ahora tampoco necesita adivinarla:
 * sin visita previa el modo es el mismo aqui y en el navegador. Solo difieren
 * cuando alguien ya eligio oscuro, y para eso esta el suppressHydrationWarning del
 * layout.
 */
export function getServerThemeMode(): ThemeMode {
  return DEFAULT_MODE;
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

  return () => {
    listeners.delete(listener);
  };
}

/**
 * El script anti-parpadeo, para el <head>.
 *
 * Corre sincrono antes de la primera pintura. Ahora solo tiene un caso que
 * atender: quien ya eligio oscuro. Sin el, ese documento sale con la clase clara
 * del servidor y salta a oscuro al hidratar, y ese salto se ve justo en quien
 * pidio lo contrario.
 *
 * Los nombres de clase se INTERPOLAN desde themeModeClass en vez de escribirse en
 * la plantilla. Asi la convencion `cds--` sigue viviendo solo en zone.ts — que es
 * el unico archivo exento de la regla — y este script no puede quedarse apuntando
 * a una clase que el CSS dejo de emitir.
 */
export function themeModeScript(): string {
  const fallback = JSON.stringify(themeModeClass(DEFAULT_MODE));
  const dark = JSON.stringify(themeModeClass("dark"));
  const key = JSON.stringify(THEME_STORAGE_KEY);

  return (
    `(function(){var c=${fallback};try{if(localStorage.getItem(${key})==="dark")c=${dark};}` +
    `catch(e){}document.documentElement.classList.add(c);})()`
  );
}
