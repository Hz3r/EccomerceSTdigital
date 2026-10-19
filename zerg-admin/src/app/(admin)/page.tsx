"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowDownRight,
  ArrowUpRight,
  Clock,
  PanelsTopLeft,
  Plus,
  Receipt,
  ShoppingCart,
  Users,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AreaChart } from "@/components/charts/area-chart";
import { BarList } from "@/components/charts/bar-list";
import { Sparkline } from "@/components/charts/sparkline";
import { STATUS_META, StatusBreakdown } from "@/components/charts/status-breakdown";
import { useAuth } from "@/hooks/useAuth";
import { useLiveVersion } from "@/lib/live";
import api from "@/lib/axios";
import { formatCompactPrice, formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { AdminStats } from "@/types";

const dayLabel = new Intl.DateTimeFormat("es-PE", { day: "numeric", month: "short" });
const dateTime = new Intl.DateTimeFormat("es-PE", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

function Card({ title, subtitle, action, className, children }: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cn("rounded-2xl border bg-card p-5", className)}>
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h2 className="font-bold">{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function StatTile({ label, value, icon: Icon, delta, footer, href, children }: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  delta?: number;
  footer?: string;
  href?: string;
  children?: React.ReactNode;
}) {
  const body = (
    <>
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <span className="flex size-8 items-center justify-center rounded-lg bg-brand/12 text-brand-strong dark:text-brand-bright">
          <Icon className="size-4" />
        </span>
      </div>
      <p className="mt-2 text-2xl font-extrabold tracking-tight">{value}</p>
      <div className="mt-1 flex items-center justify-between gap-2">
        {delta !== undefined ? (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 text-xs font-semibold whitespace-nowrap",
              delta >= 0 ? "text-[#006300] dark:text-viz-good" : "text-viz-critical"
            )}
          >
            {delta >= 0 ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
            {delta >= 0 ? "+" : ""}
            {delta.toFixed(1)}%
            <span className="ml-1 font-normal text-muted-foreground">vs mes ant.</span>
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">{footer}</span>
        )}
        {children}
      </div>
    </>
  );
  const className = "block rounded-2xl border bg-card p-5 transition-colors";
  return href ? (
    <Link href={href} className={cn(className, "hover:border-brand/50")}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState(false);

  // Se actualiza en vivo con los cambios de la tienda y de otras pestañas
  const liveVersion = useLiveVersion("orders", "products", "plans", "users", "reviews");

  useEffect(() => {
    api
      .get<{ data: AdminStats }>("/admin/stats")
      .then((res) => setStats(res.data.data))
      .catch(() => setError(true));
  }, [liveVersion]);

  if (error) {
    return (
      <div className="rounded-2xl border border-dashed p-10 text-center">
        <p className="font-semibold">No pudimos cargar las métricas</p>
        <p className="mt-1 text-sm text-muted-foreground">Revisa que el backend esté encendido y vuelve a intentar.</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className={cn("h-32 animate-pulse rounded-2xl bg-muted", i >= 4 && "h-72 sm:col-span-2")} />
        ))}
      </div>
    );
  }

  const series = stats.charts.ventasPorDia;
  const points = series.map((d) => ({
    label: dayLabel.format(new Date(`${d.fecha}T12:00:00`)),
    value: d.ingresos,
    detail: `${d.ordenes} ${d.ordenes === 1 ? "orden" : "órdenes"}`,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight md:text-3xl">
            Hola, {user?.nombre?.split(" ")[0] ?? "admin"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Así va tu tienda en los últimos 30 días.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="h-10 rounded-xl" render={<Link href="/content/home" />} nativeButton={false}>
            <PanelsTopLeft className="size-4" />
            Editar portada
          </Button>
          <Button className="h-10 rounded-xl" render={<Link href="/products?nuevo=1" />} nativeButton={false}>
            <Plus className="size-4" />
            Nuevo producto
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Ingresos del mes" value={formatPrice(stats.revenue.thisMonth)} icon={Wallet} delta={stats.revenue.growth}>
          <Sparkline values={series.map((d) => d.ingresos)} className="h-7 w-16 shrink-0" />
        </StatTile>
        <StatTile
          label="Órdenes · 30 días"
          value={stats.last30Days.orders.toLocaleString("es-PE")}
          icon={ShoppingCart}
          footer={`${stats.totalOrders.toLocaleString("es-PE")} en total`}
          href="/orders"
        />
        <StatTile
          label="Ticket promedio"
          value={formatPrice(stats.last30Days.averageTicket)}
          icon={Receipt}
          footer="Por orden, últimos 30 días"
        />
        <StatTile
          label="Clientes registrados"
          value={stats.totalCustomers.toLocaleString("es-PE")}
          icon={Users}
          footer={`${stats.activeProducts} productos activos`}
          href="/users"
        />
      </div>

      {stats.pendingOrders > 0 && (
        <Link
          href="/orders"
          className="flex items-center gap-3 rounded-2xl border border-viz-warning/40 bg-viz-warning/10 px-5 py-3.5 text-sm transition-colors hover:bg-viz-warning/15"
        >
          <Clock className="size-4 text-viz-warning" />
          <span className="flex-1">
            Tienes <b>{stats.pendingOrders}</b> {stats.pendingOrders === 1 ? "orden pendiente" : "órdenes pendientes"} de entrega.
          </span>
          <span className="font-semibold">Revisar</span>
        </Link>
      )}

      <div className="grid gap-4 xl:grid-cols-3">
        <Card
          title="Ingresos diarios"
          subtitle={`Últimos 30 días · ${formatPrice(stats.last30Days.revenue)} en total, sin canceladas`}
          className="xl:col-span-2"
        >
          <AreaChart
            data={points}
            formatValue={formatPrice}
            formatTick={formatCompactPrice}
            ariaLabel="Ingresos diarios de los últimos 30 días"
          />
          <details className="mt-4 text-sm">
            <summary className="cursor-pointer text-xs font-semibold text-muted-foreground hover:text-foreground">
              Ver como tabla
            </summary>
            <div className="mt-3 max-h-64 overflow-y-auto rounded-lg border">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-muted text-left text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 font-medium">Día</th>
                    <th className="px-3 py-2 text-right font-medium">Órdenes</th>
                    <th className="px-3 py-2 text-right font-medium">Ingresos</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {[...points].reverse().map((p, i) => (
                    <tr key={p.label}>
                      <td className="px-3 py-1.5">{p.label}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums">{series[series.length - 1 - i].ordenes}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums">{formatPrice(p.value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </Card>

        <Card title="Órdenes por estado" subtitle="Todas las órdenes registradas">
          <StatusBreakdown data={stats.charts.ordenesPorEstado} />
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card title="Ventas por categoría" subtitle="Últimos 30 días">
          <BarList
            items={stats.charts.ventasPorCategoria.map((c) => ({ label: c.categoria, value: c.ingresos }))}
            formatValue={formatPrice}
          />
        </Card>

        <Card title="Más vendidos" subtitle="Por unidades, últimos 30 días">
          {stats.charts.productosMasVendidos.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Sin ventas en este periodo.</p>
          ) : (
            <ol className="divide-y">
              {stats.charts.productosMasVendidos.map((p, i) => (
                <li key={p.slug} className="flex items-center gap-3 py-2.5 text-sm">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-bold tabular-nums">
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate font-medium">{p.producto}</span>
                  <span className="text-xs tabular-nums text-muted-foreground">{p.unidades} u.</span>
                  <span className="w-24 text-right text-xs font-semibold tabular-nums">{formatPrice(p.ingresos)}</span>
                </li>
              ))}
            </ol>
          )}
        </Card>

        <Card
          title="Órdenes recientes"
          action={
            <Link href="/orders" className="text-xs font-semibold text-brand-strong hover:underline dark:text-brand-bright">
              Ver todas
            </Link>
          }
        >
          <ul className="divide-y">
            {stats.recentOrders.map((o) => {
              const meta = STATUS_META[o.status];
              return (
                <li key={o.id} className="flex items-center gap-3 py-2.5 text-sm">
                  <meta.icon className="size-4 shrink-0" style={{ color: meta.color }} aria-label={meta.label} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{o.nombreCliente}</span>
                    <span className="block text-[11px] text-muted-foreground">
                      {o.numeroOrden} · {dateTime.format(new Date(o.creadoEn))}
                    </span>
                  </span>
                  <span className="text-right">
                    <span className="block text-xs font-semibold tabular-nums">{formatPrice(o.total)}</span>
                    <span className="block text-[11px] text-muted-foreground">{meta.label}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>
    </div>
  );
}
