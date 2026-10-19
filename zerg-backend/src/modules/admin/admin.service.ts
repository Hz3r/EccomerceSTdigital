import { getPrisma } from "../../config/database.js";

const DAYS = 30;

// Fecha local del servidor (YYYY-MM-DD), coherente con el inicio del rango.
function dayKey(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

// Series para los gráficos del dashboard (últimos 30 días, sin órdenes canceladas).
async function getChartData(db: ReturnType<typeof getPrisma>) {
  const since = new Date();
  since.setHours(0, 0, 0, 0);
  since.setDate(since.getDate() - (DAYS - 1));

  const [orders, statusGroups, pendingReviews, totalCustomers, activeProducts] = await Promise.all([
    db.order.findMany({
      where: { creadoEn: { gte: since }, status: { not: "CANCELADO" } },
      select: {
        creadoEn: true,
        total: true,
        items: {
          select: {
            cantidad: true,
            precioUnitario: true,
            plan: {
              select: {
                id: true,
                nombre: true,
                product: { select: { nombre: true, slug: true, category: { select: { nombre: true, slug: true } } } },
              },
            },
          },
        },
      },
    }),
    db.order.groupBy({ by: ["status"], _count: { _all: true } }),
    db.review.count({ where: { isApproved: false } }),
    db.user.count({ where: { rol: "CLIENTE" } }),
    db.product.count({ where: { isActivo: true } }),
  ]);

  const byDay = new Map<string, { fecha: string; ingresos: number; ordenes: number }>();
  for (let i = 0; i < DAYS; i++) {
    const d = new Date(since);
    d.setDate(since.getDate() + i);
    byDay.set(dayKey(d), { fecha: dayKey(d), ingresos: 0, ordenes: 0 });
  }

  const byCategory = new Map<string, { categoria: string; slug: string; ingresos: number }>();
  const byProduct = new Map<string, { producto: string; slug: string; unidades: number; ingresos: number }>();

  for (const order of orders) {
    const day = byDay.get(dayKey(order.creadoEn));
    if (day) {
      day.ingresos += Number(order.total);
      day.ordenes += 1;
    }
    for (const item of order.items) {
      const amount = Number(item.precioUnitario) * item.cantidad;
      const product = item.plan.product;
      const cat = byCategory.get(product.category.slug) ?? { categoria: product.category.nombre, slug: product.category.slug, ingresos: 0 };
      cat.ingresos += amount;
      byCategory.set(product.category.slug, cat);
      const prod = byProduct.get(product.slug) ?? { producto: product.nombre, slug: product.slug, unidades: 0, ingresos: 0 };
      prod.unidades += item.cantidad;
      prod.ingresos += amount;
      byProduct.set(product.slug, prod);
    }
  }

  const round = (n: number) => Math.round(n * 100) / 100;
  const ventasPorDia = [...byDay.values()].map((d) => ({ ...d, ingresos: round(d.ingresos) }));
  const ingresos30 = ventasPorDia.reduce((sum, d) => sum + d.ingresos, 0);
  const ordenes30 = ventasPorDia.reduce((sum, d) => sum + d.ordenes, 0);

  return {
    kpis: {
      pendingReviews,
      totalCustomers,
      activeProducts,
      last30Days: {
        revenue: round(ingresos30),
        orders: ordenes30,
        averageTicket: ordenes30 > 0 ? round(ingresos30 / ordenes30) : 0,
      },
    },
    series: {
      ventasPorDia,
      ordenesPorEstado: statusGroups.map((g) => ({ estado: g.status, cantidad: g._count._all })),
      ventasPorCategoria: [...byCategory.values()]
        .map((c) => ({ ...c, ingresos: round(c.ingresos) }))
        .sort((a, b) => b.ingresos - a.ingresos),
      productosMasVendidos: [...byProduct.values()]
        .map((p) => ({ ...p, ingresos: round(p.ingresos) }))
        .sort((a, b) => b.unidades - a.unidades || b.ingresos - a.ingresos)
        .slice(0, 6),
    },
  };
}

export const getStats = async () => {
  const now = new Date();
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const db = getPrisma();

  const [
    totalProducts,
    totalCategories,
    totalOrders,
    totalUsers,
    pendingOrders,
    revenueThisMonth,
    revenueLastMonth,
    recentOrders,
    topProducts,
  ] = await Promise.all([
    db.product.count(),
    db.category.count(),
    db.order.count(),
    db.user.count(),
    db.order.count({ where: { status: "PENDIENTE" } }),
    db.order.aggregate({
      where: {
        creadoEn: { gte: startOfThisMonth },
        status: { not: "CANCELADO" },
      },
      _sum: { total: true },
    }),
    db.order.aggregate({
      where: {
        creadoEn: { gte: startOfLastMonth, lt: startOfThisMonth },
        status: { not: "CANCELADO" },
      },
      _sum: { total: true },
    }),
    db.order.findMany({
      take: 5,
      orderBy: { creadoEn: "desc" },
      include: {
        items: {
          include: {
            plan: { select: { nombre: true } },
          },
        },
      },
    }),
    db.product.findMany({
      take: 5,
      orderBy: {
        reviews: { _count: "desc" },
      },
      include: {
        _count: { select: { reviews: true, plans: true } },
      },
    }),
  ]);

  const thisMonthRevenue = Number(revenueThisMonth._sum.total) || 0;
  const lastMonthRevenue = Number(revenueLastMonth._sum.total) || 0;
  const growth =
    lastMonthRevenue > 0
      ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
      : 0;

  const charts = await getChartData(db);

  return {
    ...charts.kpis,
    charts: charts.series,
    totalProducts,
    totalCategories,
    totalOrders,
    totalUsers,
    pendingOrders,
    revenue: {
      thisMonth: thisMonthRevenue,
      lastMonth: lastMonthRevenue,
      growth: Math.round(growth * 100) / 100,
    },
    recentOrders,
    topProducts,
  };
};
