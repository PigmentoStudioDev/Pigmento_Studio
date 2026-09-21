import { Heading } from "../../atoms/Heading/Heading";
import { ScrollReveal } from "../../layout/ScrollReveal/ScrollReveal";
import { LegalToc } from "./LegalToc";
import styles from "./LegalDocument.module.scss";

/**
 * Un texto legal completo: la cabecera, el indice pegajoso al lado y el cuerpo.
 *
 * La forma sale de la plantilla de referencia (Relume Content 28): dos columnas,
 * el indice a un lado y pegajoso, plegado en movil. De ahi se tomo la ESTRUCTURA,
 * no el codigo — el suyo es Tailwind, `prose` y un acordeon de shadcn.
 *
 * El indice se DERIVA de las secciones y no llega como prop aparte. Dos listas
 * que hay que mantener iguales acaban distintas, y aqui "distintas" significa una
 * entrada que no lleva a ningun sitio. Solo entran las que tienen ancla: una
 * seccion sin destino se lee en el cuerpo y no se enlaza.
 *
 * El CUERPO no lleva ScrollReveal, al contrario que el resto de organismos del
 * sitio. Un legal no se contempla: se busca con Ctrl+F, se cita y se enlaza por
 * ancla. Un parrafo que entra al hacer scroll es un parrafo que no esta cuando
 * alguien llega directo a `#vigencia`. La cabecera si entra: es la portada.
 *
 * Props planas y serializables: las alimenta 1:1 el adaptador del CMS, y el
 * contrato de modularidad prohibe que el design system conozca `payload-types`.
 */
export interface LegalDocumentSection {
  /**
   * El destino del enlace del indice. `null` si no tiene: la seccion se lee igual
   * y se queda fuera del indice. Un texto legal no desaparece por no tener ancla.
   */
  anchor: string | null;
  heading: string;
  /** 2 es seccion y 3 subseccion. */
  level: 2 | 3;
  /** Un parrafo por bloque, ya partido por el adaptador. */
  body: string[];
  /** La lista que sigue al cuerpo. Vacia si no hay. */
  items: string[];
}

export interface LegalDocumentProps {
  title: string;
  /**
   * Ya formateada y traducida por la pagina. El design system no sabe de idiomas,
   * y una fecha se escribe distinto en cada uno.
   */
  effectiveDateLabel?: string | null;
  intro: string[];
  /** El rotulo visible del indice, del CMS. */
  tocTitle: string;
  /** El nombre accesible del indice. Del diccionario, no del CMS. */
  tocLabel: string;
  sections: LegalDocumentSection[];
  /** Para que <Section labelledBy> tenga a quien apuntar. */
  titleId?: string;
}

export function LegalDocument({
  title,
  effectiveDateLabel,
  intro,
  tocTitle,
  tocLabel,
  sections,
  titleId,
}: LegalDocumentProps) {
  return (
    <div className={styles.root}>
      <header className={styles.head}>
        <ScrollReveal>
          <Heading level={1} id={titleId}>
            {title}
          </Heading>
        </ScrollReveal>

        {effectiveDateLabel ? (
          <ScrollReveal by="block">
            <p className={styles.effective}>{effectiveDateLabel}</p>
          </ScrollReveal>
        ) : null}

        {intro.map((paragraph) => (
          <ScrollReveal key={paragraph}>
            <p className={styles.intro}>{paragraph}</p>
          </ScrollReveal>
        ))}
      </header>

      <div className={styles.columns}>
        {/* Primero en el marcado: en movil el indice va arriba, como en la
            plantilla, y asi el orden visual y el de lectura coinciden sin
            reordenar nada por CSS. */}
        <div className={styles.aside}>
          <LegalToc
            title={tocTitle}
            label={tocLabel}
            items={sections.filter(
              (section): section is LegalDocumentSection & { anchor: string } =>
                section.anchor !== null,
            )}
          />
        </div>

        <article className={styles.body}>
          {sections.map((section) => (
            <section
              key={section.anchor ?? section.heading}
              id={section.anchor ?? undefined}
              className={styles.section}
            >
              <Heading level={section.level} size={section.level === 2 ? "title" : "lead"}>
                {section.heading}
              </Heading>

              {section.body.map((paragraph) => (
                <p key={paragraph} className={styles.paragraph}>
                  {paragraph}
                </p>
              ))}

              {section.items.length > 0 ? (
                <ul className={styles.list}>
                  {section.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : null}
            </section>
          ))}
        </article>
      </div>
    </div>
  );
}
