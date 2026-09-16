"use client";

import { useEffect, useRef, useState } from "react";
import { MOTION_BREAKPOINTS, REDUCED_MOTION } from "./breakpoints";
import { loadMotion, loadObserver, type MatchMedia } from "./gsap";

/**
 * Reticula infinita que se envuelve por los cuatro lados y se arrastra.
 *
 * Sin `wheel`: vive en un hero con pagina debajo, y secuestrar la rueda deja al
 * visitante atrapado en la portada.
 */

export const INFINITE_GRID_STATUS = "data-infinite-grid-status";

const OVERSCAN = 1;
const COLUMN_OFFSET = 0.33;
const COLUMN_SPEED = [1, 1, 0.9];

/** px/s, igual que el marquee. */
const DRIFT_X = 9;
const DRIFT_Y = 5;

const DRAG_SPEED = 1.2;
const DRAG_CLAMP = 80;
const X_TO_Y_INFLUENCE = 0.2;

/** Fraccion por fotograma a 60fps; se corrige por delta para no ir el doble en 120Hz. */
const POSITION_LERP = 0.08;
const SCALE_LERP = 0.06;
const FRAME_MS = 1000 / 60;

const MIN_CARD_SCALE = 0.9;

/** La escala sale de lo que le falta a la malla para alcanzar al puntero, sin temporizador. */
const TRAVEL_FOR_MIN_SCALE = 120;

const MIN_ITEMS_FOR_SHIFT = 4;
const ROW_SHIFT = 2;

/**
 * Que pieza va en cada celda. Con `fila * 2 + columna` ningun vecino (lado, arriba,
 * diagonal) repite mientras haya cuatro piezas o mas.
 *
 * HACK: en la costura entre copias del mosaico una pieza puede tocarse consigo misma.
 * Upgrade: sembrar por distancia al centro cuando el portafolio pase de ~20 piezas.
 */
export function itemIndexAt(row: number, column: number, total: number): number {
  if (total <= 0) return 0;

  const shift = total < MIN_ITEMS_FOR_SHIFT ? 1 : ROW_SHIFT;

  return (row * shift + column) % total;
}

function wrap(value: number, size: number): number {
  return ((value % size) + size) % size;
}

export interface InfiniteGridSize {
  columns: number;
  rows: number;
}

const UNMEASURED: InfiniteGridSize = { columns: 0, rows: 0 };

export function useInfiniteGrid<T extends HTMLElement, U extends HTMLElement>() {
  const rootRef = useRef<T>(null);
  const fieldRef = useRef<U>(null);
  const [size, setSize] = useState<InfiniteGridSize>(UNMEASURED);

  useEffect(() => {
    const root = rootRef.current;
    const field = fieldRef.current;
    if (!root || !field) return;

    const measure = () => {
      const first = field.firstElementChild as HTMLElement | null;
      if (!first) return;

      const itemWidth = first.offsetWidth;
      const itemHeight = first.offsetHeight;
      // Con cero, Math.ceil da Infinity y el Array.from del componente cuelga el navegador.
      if (!itemWidth || !itemHeight) return;

      setSize((current) => {
        const columns = Math.max(1, Math.ceil(root.clientWidth / itemWidth) + OVERSCAN * 2);
        const rows = Math.max(1, Math.ceil(root.clientHeight / itemHeight) + OVERSCAN * 2);

        return current.columns === columns && current.rows === rows ? current : { columns, rows };
      });
    };

    measure();

    if (typeof ResizeObserver === "undefined") return;

    const resize = new ResizeObserver(measure);
    resize.observe(root);

    return () => resize.disconnect();
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    const field = fieldRef.current;
    if (!root || !field || size.columns === 0) return;

    const items = Array.from(field.children) as HTMLElement[];
    const first = items[0];
    if (!first) return;

    const itemWidth = first.offsetWidth;
    const itemHeight = first.offsetHeight;
    if (!itemWidth || !itemHeight) return;

    const { columns, rows } = size;
    const fieldWidth = columns * itemWidth;
    const fieldHeight = rows * itemHeight;
    const centerColumn = Math.floor(columns / 2);
    const centerRow = Math.floor(rows / 2);
    const overscanX = itemWidth * OVERSCAN;
    const overscanY = itemHeight * OVERSCAN;

    const origin = {
      x: root.clientWidth / 2 - centerColumn * itemWidth - itemWidth / 2,
      y: root.clientHeight / 2 - centerRow * itemHeight - itemHeight / 2,
    };

    const pos = { x: origin.x, y: origin.y, targetX: origin.x, targetY: origin.y };
    const scale = { current: 1, target: 1 };

    let cancelled = false;
    let mm: MatchMedia | undefined;

    void Promise.all([loadMotion(), loadObserver()]).then(([{ gsap }, Observer]) => {
      if (cancelled) return;

      const cells = items.map((item, index) => {
        const column = index % columns;
        const row = Math.floor(index / columns);

        return {
          baseX: column * itemWidth,
          baseY: row * itemHeight,
          offsetY: (column - centerColumn) * itemHeight * COLUMN_OFFSET,
          speed: COLUMN_SPEED[column % COLUMN_SPEED.length],
          setX: gsap.quickSetter(item, "x", "px"),
          setY: gsap.quickSetter(item, "y", "px"),
          setScale: gsap.quickSetter(item.firstElementChild as HTMLElement, "scale"),
        };
      });

      function place() {
        const travelled = pos.y - origin.y;

        for (const cell of cells) {
          cell.setX(wrap(cell.baseX + pos.x + overscanX, fieldWidth) - overscanX);
          cell.setY(
            wrap(
              cell.baseY + origin.y + cell.offsetY + travelled * cell.speed + overscanY,
              fieldHeight,
            ) - overscanY,
          );
        }
      }

      // Colocar es layout, no motion: corre tambien con reduced-motion.
      place();
      gsap.set(items, { opacity: 1 });
      root.setAttribute(INFINITE_GRID_STATUS, "idle");

      mm = gsap.matchMedia();

      mm.add({ ...MOTION_BREAKPOINTS, isReduced: REDUCED_MOTION }, (context) => {
        if (context.conditions?.isReduced) return;

        let dragging = false;

        function tick(_time: number, deltaTime: number) {
          const frames = deltaTime / FRAME_MS;
          const positionLerp = 1 - (1 - POSITION_LERP) ** frames;
          const scaleLerp = 1 - (1 - SCALE_LERP) ** frames;

          if (!dragging) {
            const seconds = deltaTime / 1000;
            pos.targetX += DRIFT_X * seconds;
            pos.targetY += DRIFT_Y * seconds;
          }

          pos.x += (pos.targetX - pos.x) * positionLerp;
          pos.y += (pos.targetY - pos.y) * positionLerp;

          const travel = Math.hypot(pos.targetX - pos.x, pos.targetY - pos.y);
          scale.target = gsap.utils.interpolate(
            1,
            MIN_CARD_SCALE,
            gsap.utils.clamp(0, 1, travel / TRAVEL_FOR_MIN_SCALE),
          );
          scale.current += (scale.target - scale.current) * scaleLerp;

          place();
          for (const cell of cells) cell.setScale(scale.current);
        }

        gsap.ticker.add(tick);

        const observer = Observer.create({
          target: root,
          // Sin preventDefault para que el `touch-action: pan-y` de la hoja deje scrollear.
          type: "touch,pointer",
          dragMinimum: 3,
          onPress: () => {
            dragging = true;
            root.setAttribute(INFINITE_GRID_STATUS, "dragging");
          },
          onRelease: () => {
            dragging = false;
            root.setAttribute(INFINITE_GRID_STATUS, "idle");
          },
          onDrag: (self) => {
            const deltaX = gsap.utils.clamp(-DRAG_CLAMP, DRAG_CLAMP, self.deltaX * DRAG_SPEED);
            const deltaY = gsap.utils.clamp(-DRAG_CLAMP, DRAG_CLAMP, self.deltaY * DRAG_SPEED);

            pos.targetX += deltaX;
            pos.targetY += deltaY + deltaX * X_TO_Y_INFLUENCE;
          },
        });

        return () => {
          gsap.ticker.remove(tick);
          observer.kill();
          root.setAttribute(INFINITE_GRID_STATUS, "idle");
        };
      });
    });

    return () => {
      cancelled = true;
      mm?.revert();
    };
  }, [size]);

  return { rootRef, fieldRef, columns: size.columns, rows: size.rows };
}
