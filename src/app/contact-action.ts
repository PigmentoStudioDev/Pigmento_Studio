"use server";

import {
  MAX_MESSAGE,
  validateContact,
  type ContactMessage,
} from "@/design-system/components/molecules/ContactForm/validate";

const TOPICS = new Set(["branding", "web", "motion", "marketing", "other"]);

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

  const errors = validateContact(message);
  if (Object.keys(errors).length > 0 || !TOPICS.has(message.topic) || message.message.length > MAX_MESSAGE) {
    throw new Error("Mensaje de contacto invalido");
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("El formulario de contacto todavia no tiene destino");
  }
}
