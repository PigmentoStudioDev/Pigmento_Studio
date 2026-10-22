/**
 * La logica del telefono, sin React: la usan el campo y la validacion del servidor.
 *
 * Portada de `phone-input` de Arc tal cual en lo que importa — patrones por pais, el
 * prefijo de larga distancia, la lectura de numeros internacionales pegados y la salida
 * en E.164 — sin libreria de metadatos: la tabla va aqui y no se descarga nada. Lo que
 * cambia es que los nombres de pais NO estan en la tabla: los da `Intl.DisplayNames` en
 * el idioma de la pagina, asi que "Mexico" sale "Mexico" en ingles y con tilde en espanol
 * sin mantener dos listas.
 *
 * La validacion es de LONGITUD por pais, no de existencia: un numero con la longitud
 * correcta puede no existir. Para un formulario de contacto alcanza; si algun dia el
 * telefono sirve para mandar un codigo, hace falta verificarlo con ese codigo.
 */
export interface PhoneCountry {
  /** ISO 3166-1 alfa-2, como "MX". */
  iso: string;
  /** Codigo de pais sin el mas, como "52". */
  dial: string;
  /** Formatos nacionales del mas corto al mas largo. `#` es un digito. */
  patterns: string[];
  /** Lo que se marca antes del numero dentro del pais, como el "0" de "07911 123456". */
  trunk: string;
  /** Un numero nacional realista: es el placeholder y la guia de escritura. */
  example: string;
  /** Ladas que eligen este pais cuando varios comparten codigo, como Canada dentro de +1. */
  areaCodes?: string[];
}

const country = (iso: string, dial: string, patterns: string | string[], example: string, trunk = "0", areaCodes?: string[]): PhoneCountry =>
  ({ iso, dial, patterns: Array.isArray(patterns) ? patterns : [patterns], example, trunk, areaCodes });

const CA_AREA_CODES = "204 226 236 249 250 263 289 306 343 354 365 367 368 382 387 403 416 418 428 431 437 438 450 468 474 506 514 519 548 579 581 584 587 604 613 639 647 672 683 705 709 742 753 778 780 782 807 819 825 867 873 879 902 905".split(" ");

export const PHONE_COUNTRIES: PhoneCountry[] = [
  country("US", "1", "(###) ###-####", "2015550123", "1"),
  country("CA", "1", "(###) ###-####", "5065550123", "1", CA_AREA_CODES),
  country("MX", "52", "## #### ####", "2221234567", ""),
  country("BR", "55", ["(##) ####-####", "(##) #####-####"], "11961234567"),
  country("AR", "54", "## ####-####", "1123456789"),
  country("CO", "57", "### ### ####", "3211234567", ""),
  country("CL", "56", "# #### ####", "221234567", ""),
  country("PE", "51", "### ### ###", "912345678"),
  country("GB", "44", "#### ######", "7400123456"),
  country("IE", "353", "## ### ####", "850123456"),
  country("FR", "33", "# ## ## ## ##", "612345678"),
  country("DE", "49", ["### #######", "### ########"], "15123456789"),
  country("ES", "34", "### ## ## ##", "612345678", ""),
  country("IT", "39", ["### ### ###", "### ### ####"], "3123456789", ""),
  country("PT", "351", "### ### ###", "912345678", ""),
  country("NL", "31", "# ########", "612345678"),
  country("BE", "32", "### ## ## ##", "470123456"),
  country("CH", "41", "## ### ## ##", "781234567"),
  country("AT", "43", ["### #######", "### ########"], "6641234567"),
  country("SE", "46", "## ### ## ##", "701234567"),
  country("NO", "47", "### ## ###", "40612345", ""),
  country("DK", "45", "## ## ## ##", "32123456", ""),
  country("FI", "358", ["## ### ####", "## ### #####"], "412345678"),
  country("PL", "48", "### ### ###", "512345678", ""),
  country("CZ", "420", "### ### ###", "601123456", ""),
  country("GR", "30", "### ### ####", "6912345678", ""),
  country("UA", "380", "## ### ## ##", "501234567"),
  country("TR", "90", "### ### ## ##", "5012345678"),
  country("IL", "972", "##-###-####", "502345678"),
  country("AE", "971", "## ### ####", "501234567"),
  country("SA", "966", "## ### ####", "512345678"),
  country("EG", "20", "### ### ####", "1001234567"),
  country("NG", "234", "### ### ####", "8021234567"),
  country("KE", "254", "### ######", "712123456"),
  country("ZA", "27", "## ### ####", "711234567"),
  country("IN", "91", "#####-#####", "8123456789"),
  country("PK", "92", "### #######", "3012345678"),
  country("CN", "86", "### #### ####", "13123456789"),
  country("JP", "81", "##-####-####", "9012345678"),
  country("KR", "82", ["##-###-####", "##-####-####"], "1020000000"),
  country("TW", "886", "### ### ###", "912345678"),
  country("HK", "852", "#### ####", "51234567", ""),
  country("SG", "65", "#### ####", "81234567", ""),
  country("PH", "63", "### ### ####", "9051234567"),
  country("ID", "62", ["###-###-####", "###-####-####", "###-####-#####"], "81234567890"),
  country("TH", "66", "## ### ####", "812345678"),
  country("VN", "84", "## ### ## ##", "912345678"),
  country("AU", "61", "### ### ###", "412345678"),
  country("NZ", "64", ["# ### ####", "## ### ####", "## #### ####"], "211234567"),
  // Centro y Sudamerica, el Caribe hispano: el publico del estudio, y la tabla de Arc
  // solo traia seis paises de la region.
  country("GT", "502", "#### ####", "51234567", ""),
  country("SV", "503", "#### ####", "70123456", ""),
  country("HN", "504", "####-####", "91234567", ""),
  country("NI", "505", "#### ####", "81234567", ""),
  country("CR", "506", "#### ####", "83123456", ""),
  country("PA", "507", ["###-####", "####-####"], "61234567", ""),
  country("DO", "1", "(###) ###-####", "8092345678", "1", ["809", "829", "849"]),
  country("PR", "1", "(###) ###-####", "7872345678", "1", ["787", "939"]),
  country("EC", "593", ["# ### ####", "## ### ####"], "991234567"),
  country("VE", "58", "### ### ####", "4121234567"),
  country("BO", "591", "#### ####", "71234567", ""),
  country("PY", "595", "### ### ###", "961456789"),
  country("UY", "598", "## ### ###", "94231234"),
];

export const BY_ISO = new Map(PHONE_COUNTRIES.map((entry) => [entry.iso, entry]));
const capacity = (pattern: string) => pattern.split("#").length - 1;
export const lengthsOf = (entry: PhoneCountry) => entry.patterns.map(capacity);
export const onlyDigits = (text: string) => text.replace(/\D/g, "");

/** Un prefijo escrito gana su propio hueco; sin el, el tope es la longitud valida mas larga. */
export const capDigits = (entry: PhoneCountry, digits: string) =>
  digits.slice(0, splitTrunk(entry, digits)[0].length + Math.max(...lengthsOf(entry)));

/** Letras de indicador regional. Donde no hay glifos de bandera se leen las dos letras. */
export const flagOf = (iso: string) =>
  String.fromCodePoint(...[...iso.toUpperCase()].map((char) => 0x1f1e6 + char.charCodeAt(0) - 65));

export function splitTrunk(entry: PhoneCountry, digits: string): [string, string] {
  return entry.trunk && digits.startsWith(entry.trunk) ? [entry.trunk, digits.slice(entry.trunk.length)] : ["", digits];
}

/** Los separadores solo se pintan con digitos detras: un numero a medias no acaba en ") ". */
function applyPattern(digits: string, pattern: string) {
  let out = "";
  let index = 0;
  for (const char of pattern) {
    if (index >= digits.length) break;
    out += char === "#" ? digits[index++] : char;
  }
  return out + digits.slice(index);
}

function patternFor(entry: PhoneCountry, length: number) {
  return entry.patterns.find((pattern) => capacity(pattern) >= length) ?? entry.patterns[entry.patterns.length - 1]!;
}

/** Formatea los digitos nacionales segun se escriben, respetando un prefijo escrito. */
export function formatNational(entry: PhoneCountry, digits: string) {
  const [trunk, rest] = splitTrunk(entry, digits);
  const pattern = patternFor(entry, rest.length);
  const body = applyPattern(rest, pattern);
  if (!trunk) return body;
  if (!rest) return trunk;
  return trunk + (/^#/.test(pattern) ? "" : " ") + body;
}

export type PhoneStatus = "empty" | "incomplete" | "valid" | "too-long";

export function statusOf(entry: PhoneCountry, digits: string): PhoneStatus {
  const length = splitTrunk(entry, digits)[1].length;
  const lengths = lengthsOf(entry);
  if (!length) return "empty";
  if (lengths.includes(length)) return "valid";
  return length > Math.max(...lengths) ? "too-long" : "incomplete";
}

export const toE164 = (entry: PhoneCountry, digits: string) => {
  const rest = splitTrunk(entry, digits)[1];
  return rest ? `+${entry.dial}${rest}` : "";
};

/** Lee "+44 (0)7911 123456", "0044 7911..." o "+525512345678". Gana el codigo mas largo. */
export function parsePhoneNumber(
  input: string,
  pool: PhoneCountry[] = PHONE_COUNTRIES,
): { country: PhoneCountry; national: string } | null {
  const trimmed = input.trim();
  let digits = onlyDigits(trimmed);
  if (!trimmed.startsWith("+")) {
    if (!trimmed.startsWith("00")) return null;
    digits = digits.slice(2);
  }
  for (const size of [3, 2, 1]) {
    const dial = digits.slice(0, size);
    const matches = pool.filter((entry) => entry.dial === dial);
    if (!matches.length) continue;
    let rest = digits.slice(size);
    const entry =
      matches.find((item) => item.areaCodes?.some((code) => rest.startsWith(code))) ??
      matches.find((item) => !item.areaCodes) ??
      matches[0]!;
    // "+44 (0)7911..." trae un cero que sobra; se quita si lo que queda sigue siendo un numero entero.
    if (entry.trunk && rest.startsWith(entry.trunk) && rest.length - entry.trunk.length >= Math.min(...lengthsOf(entry))) {
      rest = rest.slice(entry.trunk.length);
    }
    return { country: entry, national: capDigits(entry, rest) };
  }
  return null;
}

/** Lo que el servidor acepta: vacio, o un E.164 de un pais de la tabla con su longitud. */
export function isValidPhone(e164: string) {
  if (!e164) return true;
  if (!/^\+\d{6,15}$/.test(e164)) return false;
  const parsed = parsePhoneNumber(e164);
  return !!parsed && toE164(parsed.country, parsed.national) === e164 && statusOf(parsed.country, parsed.national) === "valid";
}
