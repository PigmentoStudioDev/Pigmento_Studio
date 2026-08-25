// Fundamentos: tipografia, espaciado y motion.
//
// Los nombres NO estan hardcodeados aqui: las clases .pg-type--* y .pg-spacing--*
// las genera preview.scss iterando los mapas de Carbon, y esta lista se deriva
// del mismo sitio via el modulo generado. Ver preview.scss.

import { TYPE_STYLES, SPACING_STEPS, MOTION_TOKENS } from "./tokens.generated";

export function Foundations() {
  return (
    <div className="pg-stack">
      <section>
        <h3 className="pg-type--heading-02 pg-group-title">
          Tipografia <span className="pg-muted">({TYPE_STYLES.length})</span>
        </h3>
        <div className="pg-stack pg-stack--tight">
          {TYPE_STYLES.map((name) => (
            <div key={name} className="pg-specimen">
              <code className="pg-type--code-01 pg-muted pg-specimen__name">
                {name}
              </code>
              <p className={`pg-type--${name} pg-specimen__sample`}>
                Pigmento Studio
              </p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3 className="pg-type--heading-02 pg-group-title">
          Espaciado <span className="pg-muted">({SPACING_STEPS.length})</span>
        </h3>
        <div className="pg-stack pg-stack--tight">
          {SPACING_STEPS.map(({ name, value }) => (
            <div key={name} className="pg-specimen">
              <code className="pg-type--code-01 pg-muted pg-specimen__name">
                {name}
              </code>
              <span className="pg-specimen__bar-wrap">
                <span className={`pg-bar pg-spacing--${name}`} />
                <span className="pg-type--label-01 pg-muted">{value}</span>
              </span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3 className="pg-type--heading-02 pg-group-title">
          Motion <span className="pg-muted">({MOTION_TOKENS.length})</span>
        </h3>
        <p className="pg-type--body-01 pg-muted">
          Pasa el cursor por encima para ver la duracion y la curva.
        </p>
        <div className="pg-grid">
          {MOTION_TOKENS.map(({ name, duration }) => (
            <div key={name} className={`pg-motion pg-motion--${name}`}>
              <code className="pg-type--code-01">{name}</code>
              <span className="pg-type--label-01 pg-muted">{duration}</span>
              <span className="pg-motion__track">
                <span className="pg-motion__dot" />
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
