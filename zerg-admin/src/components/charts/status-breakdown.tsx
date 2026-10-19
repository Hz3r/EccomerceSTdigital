import { CheckCircle2, Clock, Truck, XCircle, type LucideIcon } from "lucide-react";
import type { StatusOrden } from "@/types";

export const STATUS_META: Record<StatusOrden, { label: string; color: string; icon: LucideIcon }> = {
  COMPLETADO: { label: "Completado", color: "var(--viz-good)", icon: CheckCircle2 },
  ENVIADO: { label: "Enviado", color: "var(--viz-info)", icon: Truck },
  PENDIENTE: { label: "Pendiente", color: "var(--viz-warning)", icon: Clock },
  CANCELADO: { label: "Cancelado", color: "var(--viz-critical)", icon: XCircle },
};

const ORDER: StatusOrden[] = ["COMPLETADO", "ENVIADO", "PENDIENTE", "CANCELADO"];

// Parte del total por estado: una barra apilada con separación de 2px + leyenda con ícono y cifra.
export function StatusBreakdown({ data }: { data: { estado: StatusOrden; cantidad: number }[] }) {
  const counts = ORDER.map((estado) => ({ estado, cantidad: data.find((d) => d.estado === estado)?.cantidad ?? 0 }));
  const total = counts.reduce((sum, c) => sum + c.cantidad, 0);
  if (total === 0) return <p className="py-8 text-center text-sm text-muted-foreground">Aún no hay órdenes.</p>;

  return (
    <div>
      <div className="flex h-3 gap-[2px] overflow-hidden rounded-[4px]" role="img" aria-label="Órdenes por estado">
        {counts
          .filter((c) => c.cantidad > 0)
          .map((c) => (
            <div
              key={c.estado}
              title={`${STATUS_META[c.estado].label}: ${c.cantidad}`}
              style={{ width: `${(c.cantidad / total) * 100}%`, background: STATUS_META[c.estado].color }}
            />
          ))}
      </div>
      <ul className="mt-5 space-y-3">
        {counts.map((c) => {
          const meta = STATUS_META[c.estado];
          return (
            <li key={c.estado} className="flex items-center gap-3 text-sm">
              <meta.icon className="size-4 shrink-0" style={{ color: meta.color }} />
              <span className="flex-1 font-medium">{meta.label}</span>
              <span className="font-semibold tabular-nums">{c.cantidad}</span>
              <span className="w-11 text-right text-xs tabular-nums text-muted-foreground">
                {Math.round((c.cantidad / total) * 100)}%
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
