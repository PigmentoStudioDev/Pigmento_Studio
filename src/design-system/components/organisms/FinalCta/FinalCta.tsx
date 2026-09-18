import { themeAttributes, type ThemeAssignment } from "../../../theme/zone";
import { Button } from "../../atoms/Button/Button";
import { Heading } from "../../atoms/Heading/Heading";
import { ScrollHighlight } from "../../layout/ScrollHighlight/ScrollHighlight";
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
 * La placa pide oscuro en claro y claro en oscuro. No por invertir el modo —el sistema
 * no invierte nada— sino por decision de esta pieza: lo que hace que se lea como una
 * placa es el CONTRASTE con lo que tiene alrededor, y en modo oscuro una placa oscura
 * sobre fondo oscuro no se despega de nada. Por eso lo escribe para los dos modos.
 *
 * Y se resuelve sin JavaScript: publica los mismos atributos de tema que Section, y la
 * hoja global los lee bajo la clase de modo del documento. Por eso este
 * organismo se queda en el servidor mientras Marquee —que resuelve su zona en JS—
 * tuvo que cruzar al navegador.
 *
 * Props serializables: cuatro cadenas y un destino, que es un bloque de Payload 1:1.
 */
export interface FinalCtaProps {
  /** La etiqueta corta de encima del titular, en la voz de metadato del sitio. */
  label: string;
  title: string;
  /** El trozo del titular que se resalta con el scroll. */
  titleHighlight?: string;
  /** El texto del boton. Un verbo y lo que se consigue, nunca "enviar". */
  cta: string;
  href: string;
  titleId?: string;
}

/** Destaca en los dos modos: oscura sobre la pagina clara, clara sobre la oscura. */
const PANEL_THEME: ThemeAssignment = { light: "dark", dark: "light" };

export function FinalCta({ label, title, titleHighlight, cta, href, titleId }: FinalCtaProps) {
  return (
    // La placa publica su asignacion y la hoja global la aplica bajo el modo del
    // documento. Es el mismo contrato que usa la cabecera para adoptar el tema de lo
    // que tiene debajo, asi que al pasar por delante de esta placa se adapta sola.
    <div className={styles.panel} {...themeAttributes(PANEL_THEME)}>
      <ScrollReveal by="words">
        <p className={styles.label}>{label}</p>
      </ScrollReveal>

      <ScrollHighlight>
        <ScrollReveal>
          <Heading level={2} size="heading" id={titleId} highlight={titleHighlight}>
            {title}
          </Heading>
        </ScrollReveal>
      </ScrollHighlight>

      {/* El boton llega como CAJA: no hay texto que partir en una pildora — su
          etiqueta ya se parte en caracteres para rodarla al pasar por encima. */}
      <ScrollReveal by="block">
        <Button href={href} size="lg" icon="arrow-up-right">
          {cta}
        </Button>
      </ScrollReveal>
    </div>
  );
}
