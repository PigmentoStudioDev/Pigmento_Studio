"use client";

// Galeria de NUESTROS componentes.
//
// Hasta la migracion a emision delgada esto mostraba un representante de cada
// familia de Carbon, porque los atomos eran suyos. Ya no: Carbon es la plantilla
// de tokens y los componentes son de Pigmento. La galeria arranca con los que hay
// y crece con cada atomo nuevo — que es como debe crecer, no de golpe.

import { useState } from "react";
import { Button } from "../components/atoms/Button/Button";
import { Logo } from "../components/atoms/Logo/Logo";
import { Tag } from "../components/atoms/Tag/Tag";
import { NavLinkList } from "../components/molecules/NavLinkList/NavLinkList";
import { NavToggle } from "../components/molecules/NavToggle/NavToggle";

function Block({
  title,
  note,
  children,
}: {
  readonly title: string;
  readonly note?: string;
  readonly children: React.ReactNode;
}) {
  return (
    <section className="pg-block">
      <h3 className="pg-type--heading-02 pg-group-title">{title}</h3>
      {note ? <p className="pg-type--body-01 pg-muted">{note}</p> : null}
      <div className="pg-row pg-row--wrap">{children}</div>
    </section>
  );
}

export function ComponentGallery() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="pg-stack">
      <Block title="Button" note="Con href sale enlace; sin el, boton.">
        <Button emphasis="primary">Primario</Button>
        <Button emphasis="secondary">Secundario</Button>
        <Button emphasis="ghost">Ghost</Button>
        <Button disabled>Deshabilitado</Button>
        <Button href="/ds">Enlace</Button>
      </Block>

      <Block title="Button · tamanos">
        <Button size="sm">Pequeno</Button>
        <Button size="md">Medio</Button>
        <Button size="lg">Grande</Button>
      </Block>

      <Block title="Tag" note="Tonos por intencion, no por color.">
        <Tag>Neutral</Tag>
        <Tag tone="info">Info</Tag>
        <Tag tone="progress">Pronto</Tag>
      </Block>

      <Block title="Logo" note="Las dos formas viven siempre en el DOM.">
        <Logo />
        <Logo compact />
      </Block>

      <Block title="NavToggle">
        <NavToggle
          open={menuOpen}
          controls="pg-gallery-panel"
          label="Menu"
          onToggle={() => setMenuOpen(!menuOpen)}
        />
        <div id="pg-gallery-panel" hidden={!menuOpen} className="pg-type--body-01">
          Panel de ejemplo
        </div>
      </Block>

      <Block title="NavLinkList">
        <NavLinkList
          label="Ejemplo"
          items={[
            { label: "Con destino", href: "/ds" },
            { label: "Con distintivo", href: "/ds", tag: "Beta" },
            { label: "Sin destino", tag: "Pronto" },
          ]}
        />
      </Block>
    </div>
  );
}
