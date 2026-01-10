import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * Very small dependency-free virtual list (fixed row height).
 * Keeps UI snappy for large models by only rendering visible rows.
 */
export function VirtualList<T>({
  items,
  rowHeight,
  height,
  overscan = 6,
  renderRow,
  getKey
}: {
  items: T[];
  rowHeight: number;
  height: number;
  overscan?: number;
  renderRow: (item: T, index: number) => React.ReactNode;
  getKey: (item: T, index: number) => string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [scrollTop, setScrollTop] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onScroll = () => setScrollTop(el.scrollTop);
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll as any);
  }, []);

  const totalHeight = items.length * rowHeight;
  const start = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
  const end = Math.min(items.length, Math.ceil((scrollTop + height) / rowHeight) + overscan);

  const slice = useMemo(() => items.slice(start, end), [items, start, end]);

  return (
    <div ref={ref} style={{ height, overflow: "auto", position: "relative" }}>
      <div style={{ height: totalHeight, position: "relative" }}>
        {slice.map((item, i) => {
          const idx = start + i;
          const top = idx * rowHeight;
          return (
            <div key={getKey(item, idx)} style={{ position: "absolute", top, left: 0, right: 0 }}>
              {renderRow(item, idx)}
            </div>
          );
        })}
      </div>
    </div>
  );
}
