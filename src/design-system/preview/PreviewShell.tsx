"use client";

import { useState } from "react";
import { Dropdown, Tag, Theme } from "@carbon/react";
import { ComponentGallery } from "./ComponentGallery";
import { Foundations } from "./Foundations";
import { TokenExplorer } from "./TokenExplorer";
import "./preview.scss";

// Los cuatro temas de Carbon. Las cuatro clases ya llevan la capa de marca
// encima (ver design-system/styles/index.scss), asi que no hay un quinto tema
// "el nuestro": el nuestro ES cada uno de estos con los overrides aplicados.
// <Theme> solo pone la clase .cds--<tema> en un contenedor; es el mecanismo de
// Carbon, el mismo que lee useTheme().
const THEMES = [
  { id: "g100", label: "g100 — oscuro (por defecto)" },
  { id: "g90", label: "g90 — oscuro suave" },
  { id: "g10", label: "g10 — claro suave" },
  { id: "white", label: "white — claro" },
] as const;

type ThemeId = (typeof THEMES)[number]["id"];

const SECTIONS = [
  { id: "tokens", label: "Tokens semanticos" },
  { id: "fundamentos", label: "Fundamentos" },
  { id: "componentes", label: "Componentes" },
] as const;

export function PreviewShell() {
  const [theme, setTheme] = useState<ThemeId>("g100");

  const body = (
    <>
      <section id="tokens" className="pg-section">
        <h2 className="pg-section__title">Tokens semanticos</h2>
        <TokenExplorer themeKey={theme} />
      </section>

      <section id="fundamentos" className="pg-section">
        <h2 className="pg-section__title">Fundamentos</h2>
        <Foundations />
      </section>

      <section id="componentes" className="pg-section">
        <h2 className="pg-section__title">Componentes</h2>
        <ComponentGallery />
      </section>
    </>
  );

  return (
    <div className="pg-page">
      <header className="pg-header">
        <div>
          <h1 className="pg-type--display-01">Pigmento Studio</h1>
          <p className="pg-type--body-02 pg-muted">
            Preview del design system · Carbon v11 · prefijo <code>cds</code>
          </p>
          <nav className="pg-row pg-nav">
            {SECTIONS.map((section) => (
              <a key={section.id} href={`#${section.id}`}>
                <Tag type="outline">{section.label}</Tag>
              </a>
            ))}
          </nav>
        </div>

        <div className="pg-header__control">
          <Dropdown
            id="pg-theme"
            titleText="Tema"
            label="Tema"
            items={[...THEMES]}
            selectedItem={THEMES.find((item) => item.id === theme)}
            itemToString={(item) => item?.label ?? ""}
            onChange={({ selectedItem }) => {
              if (selectedItem) {
                setTheme(selectedItem.id);
              }
            }}
          />
        </div>
      </header>

      <Theme theme={theme}>{body}</Theme>
    </div>
  );
}
