import { Button } from "@/design-system/components/atoms/Button/Button";
import { Heading } from "@/design-system/components/atoms/Heading/Heading";
import { Subheading } from "@/design-system/components/atoms/Subheading/Subheading";

export default function NotFound() {
  return (
    <main className="pg-status">
      {/* level 1 y cuerpo pequeno: es el titulo del documento, pero una pagina de
          estado no es un hero. Es justo el caso para el que el titular separa el
          nivel del tamano. */}
      <Heading level={1} size="heading-m">
        Pagina no encontrada
      </Heading>

      <Subheading>La ruta que buscas no existe o cambio de sitio.</Subheading>

      <Button href="/">Volver al inicio</Button>
    </main>
  );
}
