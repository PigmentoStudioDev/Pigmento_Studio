"use client";

import { useEffect, useRef, useState } from "react";

interface Token {
  readonly name: string;
  readonly value: string;
}

const COLOR_PATTERN = /^(#|rgb|hsl|color\()/i;

/**
 * Lee los tokens reales del elemento, no una lista escrita a mano: lo que se ve
 * aqui es exactamente lo que el navegador esta aplicando. Solo funciona en
 * navegadores que enumeran custom properties en getComputedStyle (Chrome 118+,
 * Safari 18+, Firefox 128+); de ahi el aviso de fallback.
 */
function readTokens(element: HTMLElement): Token[] {
  const styles = getComputedStyle(element);
  const tokens: Token[] = [];

  for (let i = 0; i < styles.length; i += 1) {
    const property = styles.item(i);
    if (property.startsWith("--cds-")) {
      tokens.push({
        name: property,
        value: styles.getPropertyValue(property).trim(),
      });
    }
  }

  return tokens.sort((a, b) => a.name.localeCompare(b.name));
}

function groupOf(name: string): string {
  return name.replace("--cds-", "").split("-")[0];
}

interface TokenExplorerProps {
  /** Cambia al conmutar de tema para forzar una relectura. */
  readonly themeKey: string;
}

export function TokenExplorer({ themeKey }: TokenExplorerProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (rootRef.current) {
      setTokens(readTokens(rootRef.current));
    }
  }, [themeKey]);

  const needle = query.trim().toLowerCase();
  const visible = needle
    ? tokens.filter(
        (token) =>
          token.name.toLowerCase().includes(needle) ||
          token.value.toLowerCase().includes(needle),
      )
    : tokens;

  const groups = new Map<string, Token[]>();
  for (const token of visible) {
    const key = groupOf(token.name);
    const bucket = groups.get(key);
    if (bucket) {
      bucket.push(token);
    } else {
      groups.set(key, [token]);
    }
  }

  return (
    <div ref={rootRef} className="pg-stack">
      {/* Input nativo: /ds es herramienta de desarrollo y su buscador no necesita
          un componente del DS. Lo que si necesita es label asociada — un
          placeholder no es nombre accesible. */}
      <label className="pg-field">
        <span className="pg-type--label-01">Filtrar tokens</span>
        <input
          type="search"
          className="pg-input"
          placeholder="Filtrar por nombre o valor (layer, support...)"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>

      {tokens.length === 0 ? (
        <p role="status" className="pg-notice pg-type--body-01">
          <strong>Sin lectura de tokens.</strong> Este navegador no enumera custom
          properties. Los tokens siguen aplicados: solo no se pueden listar aqui.
        </p>
      ) : (
        <p className="pg-type--body-01 pg-muted">
          {visible.length} de {tokens.length} tokens · {groups.size} familias
        </p>
      )}

      {[...groups.entries()].map(([group, groupTokens]) => (
        <section key={group}>
          <h3 className="pg-type--heading-02 pg-group-title">
            {group} <span className="pg-muted">({groupTokens.length})</span>
          </h3>
          <div className="pg-grid">
            {groupTokens.map((token) => (
              <div key={token.name} className="pg-token">
                {COLOR_PATTERN.test(token.value) ? (
                  <span
                    className="pg-token__swatch"
                    style={{ background: token.value }}
                  />
                ) : (
                  <span className="pg-token__swatch pg-token__swatch--empty" />
                )}
                <span className="pg-token__body">
                  <code className="pg-type--code-01">
                    {token.name.replace("--cds-", "")}
                  </code>
                  <span className="pg-type--label-01 pg-muted">
                    {token.value || "—"}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
