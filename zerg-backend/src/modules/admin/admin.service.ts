import { getPrisma } from "../../config/database.js";

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

  return {
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
