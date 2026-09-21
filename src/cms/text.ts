/**
 * Como se convierte en datos el texto que alguien escribio en una textarea.
 *
 * Vive aparte porque lo usan dos adaptadores y la regla es la misma en los dos:
 * duplicarla es garantizar que un dia se arreglen distinto. Son funciones puras y
 * sin nada de Payload, asi que su test no necesita levantar nada.
 */

/** Una linea por renglon, sin las vacias. Es como se captura una lista en una textarea. */
export function lines(value?: string | null): string[] {
  return (value ?? '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

/** Los parrafos van separados por linea en blanco, que es como se escribe prosa. */
export function paragraphs(value?: string | null): string[] {
  return (value ?? '')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}
