"use client";

import { useEffect } from "react";
import { Button } from "@carbon/react";

// El mensaje crudo del error NUNCA llega a la UI: puede filtrar rutas internas o
// datos. Se registra el digest, que es lo que permite cruzarlo con los logs del
// servidor, y al usuario se le muestra texto propio.
export default function Error({
  error,
  reset,
}: {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}) {
  useEffect(() => {
    console.error("Error de ruta", { digest: error.digest });
  }, [error]);

  return (
    <main className="pg-status">
      <h1>Algo salio mal</h1>
      <p>No pudimos cargar esta seccion. Puedes intentarlo de nuevo.</p>
      {error.digest ? <p><code>{error.digest}</code></p> : null}
      <Button onClick={reset}>Reintentar</Button>
    </main>
  );
}
