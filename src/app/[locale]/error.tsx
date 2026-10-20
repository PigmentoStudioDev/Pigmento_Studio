"use client";

import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { Button } from "@/design-system/components/atoms/Button/Button";
import { Heading } from "@/design-system/components/atoms/Heading/Heading";
import { Subheading } from "@/design-system/components/atoms/Subheading/Subheading";

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
  const t = useTranslations("error");

  useEffect(() => {
    console.error("Error de ruta", { digest: error.digest });
  }, [error]);

  return (
    <main className="pg-status">
      <Heading level={1} size="lead">
        {t("title")}
      </Heading>

      <Subheading>{t("description")}</Subheading>
      {error.digest ? <p><code>{error.digest}</code></p> : null}
      <Button onClick={reset}>{t("retry")}</Button>
    </main>
  );
}
