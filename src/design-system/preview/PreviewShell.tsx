"use client";

import { useState } from "react";
import { Dropdown, Tag, Theme } from "@carbon/react";
import { ComponentGallery } from "./ComponentGallery";
import { Foundations } from "./Foundations";
import { TokenExplorer } from "./TokenExplorer";
import "./preview.scss";

// 'pigmento' es nuestro tema real: el g100 de Carbon con los overrides de
// _theme.scss aplicados en :root. Los otros cuatro son los temas de fabrica,
// utiles para comparar contra el nuestro sin salir de la pagina. Carbon los
// aplica con <Theme>, que solo pone la clase .cds--<tema> en un contenedor.
const THEMES = [
  { id: "pigmento", label: "Pigmento (g100 + overrides)" },
  { id: "g100", label: "g100 de fabrica" },
  { id: "g90", label: "g90" },
  { id: "g10", label: "g10" },
  { id: "white", label: "white" },
] as const;

type ThemeId = (typeof THEMES)[number]["id"];

const SECTIONS = [
  { id: "tokens", label: "Tokens semanticos" },
  { id: "fundamentos", label: "Fundamentos" },
  { id: "componentes", label: "Componentes" },
] as const;

export function PreviewShell() {
  const [theme, setTheme] = useState<ThemeId>("pigmento");

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

      {theme === "pigmento" ? body : <Theme theme={theme}>{body}</Theme>}
    </div>
  );
}
