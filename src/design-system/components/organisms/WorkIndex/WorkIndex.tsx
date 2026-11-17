"use client";

import { useState } from "react";
import { buildWorkGridRows } from "@/app/work-grid";
import { ProjectGrid } from "../ProjectGrid/ProjectGrid";
import { ProjectList } from "../ProjectList/ProjectList";
import styles from "./WorkIndex.module.scss";

/**
 * El indice de trabajo con sus dos vistas, cuadricula y lista, y el selector fijo que
 * las cambia sin recargar. El titular de la pagina vive aqui y no en cada vista: es el
 * mismo en las dos, y asi no se pierde al cambiar.
 */
export type WorkView = "grid" | "list";

export interface WorkIndexItem {
  slug: string;
  title: string;
  /** Clave de la disciplina, la que casa con una opcion del filtro. */
  discipline?: string;
  image: { src: string; alt: string; width: number; height: number };
  gallery?: { src: string; alt: string; width: number; height: number }[];
}

export interface WorkFilterOption {
  value: string;
  label: string;
}

export interface WorkIndexProps {
  items: WorkIndexItem[];
  /** Las disciplinas con al menos un proyecto, ya traducidas. "Todos" lo pone el componente. */
  filters: WorkFilterOption[];
  title: string;
  titleId: string;
  labels: {
    viewCase: string;
    viewGrid: string;
    viewList: string;
    viewSwitch: string;
    filterAll: string;
    filterLabel: string;
  };
}

function GridIcon() {
  return (
    <svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true" focusable="false">
      <rect x="2" y="2" width="7" height="7" rx="1" fill="currentColor" />
      <rect x="11" y="2" width="7" height="7" rx="1" fill="currentColor" />
      <rect x="2" y="11" width="7" height="7" rx="1" fill="currentColor" />
      <rect x="11" y="11" width="7" height="7" rx="1" fill="currentColor" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg viewBox="0 0 17 11" width="17" height="11" aria-hidden="true" focusable="false">
      <rect y="0" width="17" height="1.5" fill="currentColor" />
      <rect y="4.75" width="17" height="1.5" fill="currentColor" />
      <rect y="9.5" width="17" height="1.5" fill="currentColor" />
    </svg>
  );
}

const ALL = "all";

export function WorkIndex({ items, filters, title, titleId, labels }: WorkIndexProps) {
  const [view, setView] = useState<WorkView>("grid");
  const [filter, setFilter] = useState(ALL);

  const visible = filter === ALL ? items : items.filter((item) => item.discipline === filter);
  const options: WorkFilterOption[] = [{ value: ALL, label: labels.filterAll }, ...filters];

  return (
    <div className={styles.root}>
      <h1 id={titleId} className={styles.hiddenTitle}>
        {title}
      </h1>
      <div className={styles.filters} role="group" aria-label={labels.filterLabel}>
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            className={styles.filter}
            aria-pressed={filter === option.value}
            onClick={() => setFilter(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
      {/* La clave remonta la vista al filtrar: el gesto de entrada de las filas se rearma. */}
      {view === "grid" ? (
        <ProjectGrid key={filter} rows={buildWorkGridRows(visible)} labels={{ viewCase: labels.viewCase }} />
      ) : (
        <ProjectList key={filter} items={visible} />
      )}
      <div className={styles.bar} role="group" aria-label={labels.viewSwitch}>
        <span className={styles.heading}>
          <span className={styles.title}>{title}</span>
          <span className={styles.count}>({visible.length})</span>
        </span>
        <span className={styles.buttons}>
          <button
            type="button"
            className={styles.button}
            aria-pressed={view === "grid"}
            aria-label={labels.viewGrid}
            onClick={() => setView("grid")}
          >
            <GridIcon />
          </button>
          <button
            type="button"
            className={styles.button}
            aria-pressed={view === "list"}
            aria-label={labels.viewList}
            onClick={() => setView("list")}
          >
            <ListIcon />
          </button>
        </span>
      </div>
    </div>
  );
}
