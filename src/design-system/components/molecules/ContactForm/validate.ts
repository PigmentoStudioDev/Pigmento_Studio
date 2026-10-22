import { isValidPhone } from "../PhoneField/phone";

/**
 * Lo que valida el formulario de contacto, fuera del componente para que el servidor
 * pueda aplicar exactamente la misma regla. Una validacion que solo vive en el
 * navegador es una sugerencia: quien llama a la accion directamente se la salta.
 */
export interface ContactValues {
  name: string;
  email: string;
  /** En E.164, o vacio: el telefono es opcional y solo se rechaza si esta mal. */
  phone: string;
  message: string;
}

export interface ContactMessage extends ContactValues {
  topic: string;
}

export type ContactErrorCode = "nameRequired" | "emailRequired" | "emailInvalid" | "phoneInvalid" | "messageRequired" | "messageShort";

export type ContactErrors = Partial<Record<keyof ContactValues, ContactErrorCode>>;

// Lo justo para atrapar el error de dedo. Validar correos de verdad con una expresion
// es una carrera perdida; el unico que sabe si existe es el buzon.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Por debajo de esto no hay mensaje que contestar, solo un "hola". */
export const MIN_MESSAGE = 20;
export const MAX_MESSAGE = 1000;

export function validateContact(values: ContactValues): ContactErrors {
  const name = values.name.trim();
  const email = values.email.trim();
  const message = values.message.trim();

  return {
    ...(name ? {} : { name: "nameRequired" as const }),
    ...(!email ? { email: "emailRequired" as const } : EMAIL.test(email) ? {} : { email: "emailInvalid" as const }),
    ...(isValidPhone(values.phone.trim()) ? {} : { phone: "phoneInvalid" as const }),
    ...(!message
      ? { message: "messageRequired" as const }
      : message.length < MIN_MESSAGE
        ? { message: "messageShort" as const }
        : {}),
  };
}
