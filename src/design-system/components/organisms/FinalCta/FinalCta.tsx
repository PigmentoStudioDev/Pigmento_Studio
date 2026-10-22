import { themeAttributes, type ThemeAssignment } from "../../../theme/zone";
import { Heading } from "../../atoms/Heading/Heading";
import { ContactForm, type ContactFormProps } from "../../molecules/ContactForm/ContactForm";
import { ScrollHighlight } from "../../layout/ScrollHighlight/ScrollHighlight";
import { ScrollReveal } from "../../layout/ScrollReveal/ScrollReveal";
import styles from "./FinalCta.module.scss";

/**
 * La ultima llamada antes del pie: una placa que se despega de la pagina, con el
 * titular a un lado y el formulario de contacto al otro.
 *
 * **Una sola accion, y esa es la regla del bloque.** Antes era un boton hacia
 * /contacto; ahora la accion es el propio envio, y por eso el formulario SUSTITUYE al
 * boton en vez de sumarse. Una llamada final con dos salidas deja de ser una llamada y
 * pasa a ser un menu: quien llega hasta aqui ya decidio, y obligarle a cambiar de
 * pagina para escribir es perderle en el camino.
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
 * Props serializables salvo `onSubmit`, que es un manejador y Payload no lo alimenta:
 * lo pone la pagina con la accion de servidor.
 */
export interface FinalCtaProps {
  /** La etiqueta corta de encima del titular, en la voz de metadato del sitio. */
  label: string;
  title: string;
  /** El trozo del titular que se resalta con el scroll. */
  titleHighlight?: string;
  titleId?: string;
  form: Pick<ContactFormProps, "copy" | "locale" | "topics">;
  onSubmit?: ContactFormProps["onSubmit"];
}

/** Destaca en los dos modos: oscura sobre la pagina clara, clara sobre la oscura. */
const PANEL_THEME: ThemeAssignment = { light: "dark", dark: "light" };

export function FinalCta({ label, title, titleHighlight, titleId, form, onSubmit }: FinalCtaProps) {
  return (
    // La placa publica su asignacion y la hoja global la aplica bajo el modo del
    // documento. Es el mismo contrato que usa la cabecera para adoptar el tema de lo
    // que tiene debajo, asi que al pasar por delante de esta placa se adapta sola.
    <div className={styles.panel} {...themeAttributes(PANEL_THEME)}>
      <div className={styles.intro}>
        <ScrollReveal by="words">
          <p className={styles.label}>{label}</p>
        </ScrollReveal>

        <ScrollHighlight>
          <ScrollReveal>
            <Heading level={2} size="title" id={titleId} highlight={titleHighlight}>
              {title}
            </Heading>
          </ScrollReveal>
        </ScrollHighlight>
      </div>

      {/* El formulario llega como CAJA: partirlo por lineas desmontaria los campos. */}
      <ScrollReveal by="block">
        <ContactForm copy={form.copy} locale={form.locale} topics={form.topics} onSubmit={onSubmit} />
      </ScrollReveal>
    </div>
  );
}
