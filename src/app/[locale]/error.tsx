"use client";

import { useMessages } from "next-intl";
import { useEffect } from "react";
import { Button } from "@/design-system/components/atoms/Button/Button";
import { Heading } from "@/design-system/components/atoms/Heading/Heading";
import { Subheading } from "@/design-system/components/atoms/Subheading/Subheading";

// El mensaje crudo del error NUNCA llega a la UI: puede filtrar rutas internas o
// datos. Se registra el digest, que es lo que permite cruzarlo con los logs del
// servidor, y al usuario se le muestra texto propio.
//
// useMessages y no useTranslations: este es el unico componente de cliente que traduce,
// y useTranslations arrastra el formateador ICU al bundle de todas las paginas (230kb >
// budget de 229kb). Los tres textos son literales sin argumentos, asi que leerlos tal cual
// basta. HACK: si un texto de cliente necesita argumentos o plurales, pasar a
// useTranslations y subir el budget de JS en conformance/budgets.json.
type ErrorCopy = { readonly title: string; readonly description: string; readonly retry: string };

export default function Error({
  error,
  reset,
}: {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}) {
  const copy = useMessages().error as unknown as ErrorCopy;

  useEffect(() => {
    console.error("Error de ruta", { digest: error.digest });
  }, [error]);

  return (
    <main id="main" className="pg-status">
      <Heading level={1} size="lead">
        {copy.title}
      </Heading>

      <Subheading>{copy.description}</Subheading>
      {error.digest ? <p><code>{error.digest}</code></p> : null}
      <Button onClick={reset}>{copy.retry}</Button>
    </main>
  );
}
