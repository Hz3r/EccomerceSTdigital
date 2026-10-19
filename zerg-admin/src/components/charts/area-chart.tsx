"use client";

import { useMemo, useState } from "react";
import { useElementWidth } from "@/hooks/useElementWidth";

export interface AreaPoint {
  label: string; // etiqueta corta del eje X (ej. "12 oct")
  value: number;
  detail?: string; // texto secundario del tooltip (ej. "4 órdenes")
}

interface AreaChartProps {
  data: AreaPoint[];
  height?: number;
  formatValue: (v: number) => string;
  formatTick: (v: number) => string;
  ariaLabel: string;
}

const PAD = { top: 12, right: 12, bottom: 28, left: 52 };

const TICKS = 4;

// Paso "redondo" (1, 2, 2.5 o 5 × 10^n) para que las marcas del eje Y sean números limpios.
function niceStep(max: number) {
  if (max <= 0) return 1;
  const raw = max / TICKS;
  const exp = Math.pow(10, Math.floor(Math.log10(raw)));
  const n = raw / exp;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10;
  return step * exp;
}

// Serie única: línea de 2px con relleno al 10% y cruz de lectura al pasar el mouse.
export function AreaChart({ data, height = 260, formatValue, formatTick, ariaLabel }: AreaChartProps) {
  const [ref, width] = useElementWidth<HTMLDivElement>();
  const [active, setActive] = useState<number | null>(null);

  const geo = useMemo(() => {
    const w = Math.max(width - PAD.left - PAD.right, 1);
    const h = height - PAD.top - PAD.bottom;
    const step = niceStep(Math.max(...data.map((d) => d.value), 0));
    const max = step * TICKS;
    const x = (i: number) => PAD.left + (data.length <= 1 ? w / 2 : (i / (data.length - 1)) * w);
    const y = (v: number) => PAD.top + h - (v / max) * h;
    const line = data.map((d, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(d.value).toFixed(1)}`).join(" ");
    const area = data.length
      ? `${line} L${x(data.length - 1).toFixed(1)},${PAD.top + h} L${x(0).toFixed(1)},${PAD.top + h} Z`
      : "";
    const ticks = Array.from({ length: TICKS + 1 }, (_, i) => i * step);
    const labelEvery = Math.max(1, Math.ceil(data.length / Math.max(2, Math.floor(w / 70))));
    return { w, h, x, y, line, area, ticks, labelEvery };
  }, [data, width, height]);

  const onMove = (e: React.PointerEvent<SVGRectElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const rel = (e.clientX - rect.left) / rect.width;
    setActive(Math.min(data.length - 1, Math.max(0, Math.round(rel * (data.length - 1)))));
  };

  const point = active !== null ? data[active] : null;

  return (
    <div ref={ref} className="relative" style={{ height }}>
      {width > 0 && (
        <svg width={width} height={height} role="img" aria-label={ariaLabel} className="overflow-visible">
          {geo.ticks.map((t) => (
            <g key={t}>
              <line x1={PAD.left} x2={PAD.left + geo.w} y1={geo.y(t)} y2={geo.y(t)} stroke="var(--viz-grid)" strokeWidth={1} />
              <text x={PAD.left - 8} y={geo.y(t)} textAnchor="end" dominantBaseline="middle" className="fill-muted-foreground text-[11px] tabular-nums">
                {formatTick(t)}
              </text>
            </g>
          ))}
          {data.map((d, i) =>
            // Se omite una etiqueta que quedaría pegada a la del último día
            (i % geo.labelEvery === 0 && data.length - 1 - i >= geo.labelEvery) || i === data.length - 1 ? (
              <text key={d.label} x={geo.x(i)} y={height - 8} textAnchor="middle" className="fill-muted-foreground text-[11px]">
                {d.label}
              </text>
            ) : null
          )}

          <path d={geo.area} fill="var(--viz-series)" fillOpacity={0.1} />
          <path d={geo.line} fill="none" stroke="var(--viz-series)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

          {/* Último valor con etiqueta directa */}
          {data.length > 0 && active === null && (
            <circle cx={geo.x(data.length - 1)} cy={geo.y(data[data.length - 1].value)} r={4} fill="var(--viz-series)" stroke="var(--card)" strokeWidth={2} />
          )}

          {point && active !== null && (
            <g pointerEvents="none">
              <line x1={geo.x(active)} x2={geo.x(active)} y1={PAD.top} y2={PAD.top + geo.h} stroke="var(--viz-axis)" strokeWidth={1} />
              <circle cx={geo.x(active)} cy={geo.y(point.value)} r={5} fill="var(--viz-series)" stroke="var(--card)" strokeWidth={2} />
            </g>
          )}

          <rect
            x={PAD.left}
            y={PAD.top}
            width={geo.w}
            height={geo.h}
            fill="transparent"
            tabIndex={0}
            onPointerMove={onMove}
            onPointerLeave={() => setActive(null)}
            onFocus={() => setActive(data.length - 1)}
            onBlur={() => setActive(null)}
            onKeyDown={(e) => {
              if (e.key === "ArrowLeft") setActive((a) => Math.max(0, (a ?? data.length - 1) - 1));
              if (e.key === "ArrowRight") setActive((a) => Math.min(data.length - 1, (a ?? 0) + 1));
            }}
            className="cursor-crosshair outline-none"
          />
        </svg>
      )}

      {point && active !== null && (
        <div
          className="pointer-events-none absolute top-0 z-10 min-w-36 rounded-lg border bg-popover px-3 py-2 text-xs shadow-lg"
          style={{
            left: Math.min(Math.max(geo.x(active) - 72, 0), Math.max(width - 150, 0)),
          }}
        >
          <p className="text-sm font-bold tabular-nums">{formatValue(point.value)}</p>
          <p className="mt-0.5 flex items-center gap-1.5 text-muted-foreground">
            <span className="h-0.5 w-3 rounded-full bg-viz-series" />
            {point.label}
            {point.detail && <> · {point.detail}</>}
          </p>
        </div>
      )}
    </div>
  );
}
