import { getTranslations } from "next-intl/server";
import { Button } from "@/design-system/components/atoms/Button/Button";
import { Heading } from "@/design-system/components/atoms/Heading/Heading";
import { Subheading } from "@/design-system/components/atoms/Subheading/Subheading";

export default async function NotFound() {
  const t = await getTranslations("notFound");

  return (
    <main id="main" className="pg-status">
      {/* level 1 y cuerpo pequeno: es el titulo del documento, pero una pagina de
          estado no es un hero. Es justo el caso para el que el titular separa el
          nivel del tamano. */}
      <Heading level={1} size="lead">
        {t("title")}
      </Heading>

      <Subheading>{t("description")}</Subheading>

      <Button href="/">{t("action")}</Button>
    </main>
  );
}
