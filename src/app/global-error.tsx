"use client";

import { useEffect } from "react";

// Ultimo recurso: se dispara cuando falla el propio root layout, asi que su UI no
// puede depender de nada del layout — por eso repite <html> y <body> y no usa
// componentes de Carbon ni la hoja de estilos, que podrian ser justo lo que fallo.
export default function GlobalError({
  error,
  reset,
}: {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}) {
  useEffect(() => {
    console.error("Error global", { digest: error.digest });
  }, [error]);

  return (
    <html lang="es">
      <body
        style={{
          fontFamily: "system-ui, sans-serif",
          padding: "3rem",
          background: "#161616",
          color: "#f4f4f4",
        }}
      >
        <h1>Algo salio mal</h1>
        <p>La aplicacion no pudo iniciarse.</p>
        {error.digest ? <p><code>{error.digest}</code></p> : null}
        <button type="button" onClick={reset}>
          Reintentar
        </button>
      </body>
    </html>
  );
}
