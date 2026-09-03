import { Button } from "../../atoms/Button/Button";
import { Heading } from "../../atoms/Heading/Heading";
import { ScrollReveal } from "../../layout/ScrollReveal/ScrollReveal";
import styles from "./FinalCta.module.scss";

/**
 * La ultima llamada antes del pie: una placa que se despega de la pagina, con el
 * titular centrado y un solo destino.
 *
 * **Un solo boton, y esa es la regla del bloque.** Una llamada final con dos opciones
 * deja de ser una llamada y pasa a ser un menu: quien llega hasta aqui ya decidio, y
 * lo unico que hace falta es no ponerle a elegir otra vez.
 *
 * La placa se pinta con el rol `alt`, que es la zona INVERTIDA del modo: oscura sobre
 * la pagina clara y clara sobre la oscura. No es "siempre oscura" a proposito — lo que
 * hace que esto se lea como una placa es el CONTRASTE con lo que tiene alrededor, y en
 * modo oscuro una placa oscura sobre fondo oscuro no se despega de nada.
 *
 * Y se resuelve sin JavaScript: `data-theme-section` es el mismo atributo que publica
 * Section, y la hoja global lo lee bajo la clase de modo del documento. Por eso este
 * organismo se queda en el servidor mientras Marquee —que resuelve su zona en JS—
 * tuvo que cruzar al navegador.
 *
 * Props serializables: cuatro cadenas y un destino, que es un bloque de Payload 1:1.
 */
export interface FinalCtaProps {
  /** La etiqueta corta de encima del titular, en la voz de metadato del sitio. */
  label: string;
  title: string;
  /** El texto del boton. Un verbo y lo que se consigue, nunca "enviar". */
  cta: string;
  href: string;
  titleId?: string;
}

export function FinalCta({ label, title, cta, href, titleId }: FinalCtaProps) {
  return (
    // La placa publica su rol y la hoja global resuelve la zona contra el modo del
    // documento. Es el mismo contrato que usa la cabecera para adoptar el tema de lo
    // que tiene debajo, asi que al pasar por delante de esta placa se adapta sola.
    <div className={styles.panel} data-theme-section="alt">
      <ScrollReveal by="words">
        <p className={styles.label}>{label}</p>
      </ScrollReveal>

      <ScrollReveal>
        <Heading level={2} size="heading" id={titleId}>
          {title}
        </Heading>
      </ScrollReveal>

      {/* El boton llega como CAJA: no hay texto que partir en una pildora — su
          etiqueta ya se parte en caracteres para rodarla al pasar por encima. */}
      <ScrollReveal by="block">
        <Button href={href} size="lg">
          {cta}
        </Button>
      </ScrollReveal>
    </div>
  );
}
