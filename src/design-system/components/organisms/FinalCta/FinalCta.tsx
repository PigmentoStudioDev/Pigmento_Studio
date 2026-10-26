import { themeAttributes, type ThemeAssignment } from "../../../theme/zone";
import { ContactForm, type ContactFormProps } from "../../molecules/ContactForm/ContactForm";
import { StripHeader } from "../../molecules/StripHeader/StripHeader";
import { PaperSurface } from "../../layout/PaperSurface/PaperSurface";
import { ScrollReveal } from "../../layout/ScrollReveal/ScrollReveal";
import styles from "./FinalCta.module.scss";

/**
 * La ultima llamada antes del pie: una placa que se despega de la pagina, con la
 * cabecera de bloque arriba y el formulario de contacto debajo.
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
 * Y el tema se resuelve sin JavaScript: publica los mismos atributos de tema que
 * Section, y la hoja global los lee bajo la clase de modo del documento. Por eso este
 * organismo se queda en el servidor; lo unico que cruza es el papel del fondo, que lee
 * esos mismos colores de la zona.
 *
 * **Empieza como cualquier otro bloque.** La cabecera es la misma `StripHeader` de las
 * demas strips —titular, y debajo la etiqueta a la izquierda y la entradilla a la
 * derecha— y cada pregunta del formulario repite esa banda. Antes era su propia
 * composicion, con un titular un escalon mas grande y el formulario en una tarjeta
 * dentro de la placa: caja dentro de caja, y la unica seccion que no se leia como
 * parte de la pagina.
 *
 * Sin familia candy en el resalte: la placa invierte el tema y el resalte del tema se
 * invierte con ella, pero los tonos candy son fijos y claros, y sobre la placa oscura
 * dejarian el texto blanco sobre un pastel.
 *
 * Props serializables salvo `onSubmit`, que es un manejador y Payload no lo alimenta:
 * lo pone la pagina con la accion de servidor.
 */
export interface FinalCtaProps {
  /** La etiqueta corta de encima del titular, en la voz de metadato del sitio. */
  label: string;
  title: string;
  /** El parrafo de la columna derecha, encima del formulario. */
  intro: string;
  /** El trozo del titular que se resalta con el scroll. */
  titleHighlight?: string;
  titleId?: string;
  form: Pick<ContactFormProps, "copy" | "locale" | "topics">;
  onSubmit?: ContactFormProps["onSubmit"];
}

/** Destaca en los dos modos: oscura sobre la pagina clara, clara sobre la oscura. */
const PANEL_THEME: ThemeAssignment = { light: "dark", dark: "light" };

export function FinalCta({ label, title, intro, titleHighlight, titleId, form, onSubmit }: FinalCtaProps) {
  return (
    // La placa publica su asignacion y la hoja global la aplica bajo el modo del
    // documento. Es el mismo contrato que usa la cabecera para adoptar el tema de lo
    // que tiene debajo, asi que al pasar por delante de esta placa se adapta sola.
    <div className={styles.panel} {...themeAttributes(PANEL_THEME)}>
      {/* El fondo de la placa es papel vivo: la estela sigue al puntero y un clic fuera
          de los campos deja un anillo. Es lo unico de la placa que cruza al navegador. */}
      <PaperSurface />
      <StripHeader title={title} titleHighlight={titleHighlight} titleId={titleId} label={label} intro={intro} />

      {/* El formulario llega como CAJA: partirlo por lineas desmontaria los campos. Ocupa
          las dos columnas porque cada fila repite por dentro la banda de la cabecera:
          la pregunta cae bajo la etiqueta y lo escrito bajo la entradilla. */}
      <ScrollReveal by="block">
        <ContactForm copy={form.copy} locale={form.locale} topics={form.topics} onSubmit={onSubmit} />
      </ScrollReveal>
    </div>
  );
}
