import { describe, expect, it } from "vitest";
import { BY_ISO, formatNational, isValidPhone, parsePhoneNumber } from "./phone";

const MX = BY_ISO.get("MX")!;

describe("phone", () => {
  it("formatea Mexico mientras se escribe, sin separador colgando", () => {
    expect(formatNational(MX, "55")).toBe("55");
    expect(formatNational(MX, "551")).toBe("55 1");
    expect(formatNational(MX, "5512345678")).toBe("55 1234 5678");
  });

  it("un numero pegado con codigo elige su pais, y +1 se reparte por lada", () => {
    expect(parsePhoneNumber("+52 55 1234 5678")).toMatchObject({ country: { iso: "MX" }, national: "5512345678" });
    expect(parsePhoneNumber("+1 416 555 0123")?.country.iso).toBe("CA");
    expect(parsePhoneNumber("+1 809 234 5678")?.country.iso).toBe("DO");
    expect(parsePhoneNumber("+1 201 555 0123")?.country.iso).toBe("US");
  });

  /** Es la regla del servidor: quien llama a la accion directamente no pasa por el campo. */
  it("acepta vacio o un E.164 completo, y nada mas", () => {
    expect(isValidPhone("")).toBe(true);
    expect(isValidPhone("+525512345678")).toBe(true);
    expect(isValidPhone("+52551234")).toBe(false);
    expect(isValidPhone("5512345678")).toBe(false);
    expect(isValidPhone("+52 55 1234 5678")).toBe(false);
    expect(isValidPhone("+999123456789")).toBe(false);
  });
});
