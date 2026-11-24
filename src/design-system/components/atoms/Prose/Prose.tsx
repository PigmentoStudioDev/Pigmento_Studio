/**
 * Un texto de varios parrafos escrito como UNA cadena, separados por linea en blanco.
 *
 * Los textos del cliente llegan asi (una respuesta de FAQ son tres parrafos), y los
 * organismos reciben cadenas planas para poder alimentarse 1:1 desde mensajes o del
 * CMS. Partir aqui evita que cada organismo invente su separador o pinte los tres
 * parrafos pegados en un solo <p>.
 */
export interface ProseProps {
  text: string;
  className?: string;
}

const PARAGRAPH_BREAK = /\n{2,}/;

export function Prose({ text, className }: ProseProps) {
  const paragraphs = text
    .split(PARAGRAPH_BREAK)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  return (
    <>
      {paragraphs.map((paragraph, index) => (
        <p key={index} className={className}>
          {paragraph}
        </p>
      ))}
    </>
  );
}
