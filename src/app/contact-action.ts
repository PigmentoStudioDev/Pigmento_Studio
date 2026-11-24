"use server";

import {
  MAX_EXTRA,
  MAX_MESSAGE,
  validateContact,
  type ContactMessage,
} from "@/design-system/components/molecules/ContactForm/validate";

// Cada pagina de servicio trae su lista de temas (ronda 2 de Pigmento), asi que el
// servidor ya no puede tener la lista cerrada: valida la FORMA del identificador, que
// es lo que protege al destino de un texto libre colado por el campo de tema.
const OPTION_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MAX_OPTION_ID = 64;

const isOptionId = (value: string) => value.length <= MAX_OPTION_ID && OPTION_ID.test(value);

/** Texto corto opcional: recortado, y fuera si se pasa del tope. */
function optionalText(value: unknown): string | undefined | null {
  if (value === undefined) return undefined;
  const text = String(value).trim();
  return text.length > MAX_EXTRA ? null : text;
}

/**
 * El envio del formulario de la llamada final.
 *
 * Valida OTRA VEZ en el servidor con la misma regla que el navegador: una accion de
 * servidor es un endpoint publico, y quien la llama directamente no pasa por el
 * formulario.
 *
 * HACK: todavia sin destino — ni coleccion en Payload ni correo. En desarrollo resuelve
 * para poder ver la confirmacion; en produccion rechaza, y el formulario lo dice en vez
 * de fingir que el mensaje llego. Se sustituye cuando se decida a donde van los
 * mensajes, antes de publicar el formulario.
 */
export async function sendContact(input: ContactMessage): Promise<void> {
  const message: ContactMessage = {
    name: String(input?.name ?? "").trim(),
    email: String(input?.email ?? "").trim(),
    phone: String(input?.phone ?? "").trim(),
    topic: String(input?.topic ?? ""),
    message: String(input?.message ?? "").trim(),
  };
  const company = optionalText(input?.company);
  const website = optionalText(input?.website);
  const goal = input?.goal === undefined ? undefined : String(input.goal);

  const errors = validateContact(message);
  if (
    Object.keys(errors).length > 0 ||
    !isOptionId(message.topic) ||
    (goal !== undefined && !isOptionId(goal)) ||
    company === null ||
    website === null ||
    message.message.length > MAX_MESSAGE
  ) {
    throw new Error("Mensaje de contacto invalido");
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("El formulario de contacto todavia no tiene destino");
  }
}
