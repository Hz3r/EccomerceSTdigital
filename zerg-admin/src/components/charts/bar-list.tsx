export interface BarItem {
  label: string;
  value: number;
}

// Barras horizontales de una sola serie (magnitud): un color, valor en la punta.
export function BarList({ items, formatValue }: { items: BarItem[]; formatValue: (v: number) => string }) {
  const max = Math.max(...items.map((i) => i.value), 1);
  if (items.length === 0) return <p className="py-8 text-center text-sm text-muted-foreground">Sin ventas en este periodo.</p>;
  return (
    <ul className="space-y-3.5">
      {items.map((item) => {
        const pct = (item.value / max) * 100;
        return (
          <li key={item.label} title={`${item.label}: ${formatValue(item.value)}`}>
            <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
              <span className="truncate font-medium">{item.label}</span>
              <span className="shrink-0 text-xs font-semibold tabular-nums text-muted-foreground">{formatValue(item.value)}</span>
            </div>
            <div className="h-2.5 rounded-r-[4px] bg-viz-grid">
              <div className="h-full rounded-r-[4px] bg-viz-series transition-[width] duration-500" style={{ width: `${Math.max(pct, 1.5)}%` }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
