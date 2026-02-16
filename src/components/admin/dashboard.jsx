import { useEffect, useMemo, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebase";
import {
  CubeIcon,
  ShoppingBagIcon,
  CreditCardIcon,
  BanknotesIcon,
} from "@heroicons/react/24/outline";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [productsCount, setProductsCount] = useState(0);
  const [customersCount, setCustomersCount] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [ordersSnap, productsSnap, usersSnap] = await Promise.all([
          getDocs(collection(db, "orders")),
          getDocs(collection(db, "products")),
          getDocs(collection(db, "users")),
        ]);

        const ordersData = ordersSnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));

        const productsData = productsSnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));

        setOrders(ordersData);
        setProducts(productsData);
        setProductsCount(productsData.length);

        const customersOnly = usersSnap.docs
          .map((d) => d.data())
          .filter(
            (u) => String(u.role || "customer").toLowerCase() === "customer"
          );
        setCustomersCount(customersOnly.length);
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const metrics = useMemo(() => {
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce(
      (sum, o) => sum + Number(o.total ?? o.totalPrice ?? 0),
      0
    );

    const now = new Date();
    const todayKey = now.toISOString().slice(0, 10);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 6);
    startOfWeek.setHours(0, 0, 0, 0);

    let todayRevenue = 0;
    let weekRevenue = 0;

    const dayBuckets = new Map();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      dayBuckets.set(key, 0);
    }

    orders.forEach((o) => {
      const ts = o.createdAt;
      if (!ts) return;

      const date =
        typeof ts === "object" && ts.seconds
          ? new Date(ts.seconds * 1000)
          : new Date(ts);

      const key = date.toISOString().slice(0, 10);
      const amount = Number(o.total ?? o.totalPrice ?? 0);

      if (key === todayKey) {
        todayRevenue += amount;
      }
      if (date >= startOfWeek && date <= now) {
        weekRevenue += amount;
      }

      if (dayBuckets.has(key)) {
        dayBuckets.set(key, dayBuckets.get(key) + amount);
      }
    });

    const weeklySeries = Array.from(dayBuckets.entries()).map(
      ([key, value]) => {
        const d = new Date(key);
        const label = d.toLocaleDateString("en-US", {
          weekday: "short",
        });

        return { key, label, value };
      }
    );

    return {
      totalOrders,
      totalRevenue,
      todayRevenue,
      weekRevenue,
      weeklySeries,
    };
  }, [orders]);

  const lowStockProducts = useMemo(
    () =>
      products
        .filter((p) => typeof p.dailyLimit === "number" && p.dailyLimit <= 5 && p.dailyLimit > 0)
        .sort((a, b) => (a.dailyLimit ?? 0) - (b.dailyLimit ?? 0))
        .slice(0, 5),
    [products]
  );

  const recentOrders = useMemo(() => {
    const getTime = (timestamp) => {
      if (!timestamp) return 0;
      if (timestamp.seconds)
        return timestamp.seconds * 1000 + (timestamp.nanoseconds || 0) / 1e6;
      const d = new Date(timestamp);
      return Number.isNaN(d.getTime()) ? 0 : d.getTime();
    };

    return [...orders]
      .sort((a, b) => getTime(b.createdAt) - getTime(a.createdAt))
      .slice(0, 5);
  }, [orders]);

  const stats = [
    {
      label: "Total Products",
      value: loading ? "…" : productsCount.toString(),
      icon: CubeIcon,
      gradient: "from-blue-500 to-blue-600",
      bgGradient: "from-blue-50 to-blue-100",
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    {
      label: "Total Orders",
      value: loading ? "…" : metrics.totalOrders.toString(),
      icon: ShoppingBagIcon,
      gradient: "from-green-500 to-green-600",
      bgGradient: "from-green-50 to-green-100",
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
    },
    {
      label: "Revenue (Today)",
      value: loading ? "…" : `€${metrics.todayRevenue.toFixed(2)}`,
      icon: CreditCardIcon,
      gradient: "from-purple-500 to-purple-600",
      bgGradient: "from-purple-50 to-purple-100",
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
    },
    {
      label: "Customers",
      value: loading ? "…" : customersCount.toString(),
      icon: BanknotesIcon,
      gradient: "from-yellow-500 to-yellow-600",
      bgGradient: "from-yellow-50 to-yellow-100",
      iconBg: "bg-yellow-100",
      iconColor: "text-yellow-600",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-3 sm:p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto w-full min-w-0">
        {/* Header */}
        <div className="mb-4 sm:mb-6 md:mb-8">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-1">BCNL Dashboard</h1>
          <p className="text-xs sm:text-sm text-gray-500">
            Real-time overview of sales, orders, and customers.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className="group bg-white p-6 rounded-2xl shadow-lg border border-gray-100
                  transition-all duration-300
                  hover:-translate-y-2 hover:shadow-2xl hover:border-[#7B2220]/20
                  relative overflow-hidden"
              >
                {/* Background gradient accent */}
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${stat.bgGradient} opacity-10 rounded-full blur-2xl -mr-16 -mt-16`} />
                
                <div className="relative flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-gray-500 text-sm font-medium mb-2">{stat.label}</p>
                    <h2 className="text-3xl font-bold text-gray-900">{stat.value}</h2>
                  </div>
                  
                  {/* Icon Container */}
                  <div className={`${stat.iconBg} p-4 rounded-xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
                    <Icon className={`w-8 h-8 ${stat.iconColor}`} />
                  </div>
                </div>

                {/* Bottom accent bar */}
                <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${stat.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
              </div>
            );
          })}
        </div>

        {/* Charts & Snapshot */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Weekly Revenue Chart */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  Revenue – Last 7 Days
                </h3>
                <p className="text-xs text-gray-500">
                  All orders with totals, grouped per day.
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 uppercase tracking-wide">
                  Week Revenue
                </p>
                <p className="text-lg font-semibold text-[#502455]">
                  {loading ? "…" : `€${metrics.weekRevenue.toFixed(2)}`}
                </p>
              </div>
            </div>

            <WeeklyBarChart data={metrics.weeklySeries} />
          </div>

          {/* Orders Snapshot */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Orders Snapshot
            </h3>
            <OrdersSnapshot orders={orders} loading={loading} />
          </div>
        </div>

        {/* Inventory & Recent Orders */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <LowStockPanel
            products={lowStockProducts}
            loading={loading}
          />
          <RecentOrdersPanel
            orders={recentOrders}
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
}

function WeeklyBarChart({ data }) {
  if (!data || !data.length) {
    return (
      <div className="h-40 flex items-center justify-center text-xs text-gray-400">
        No data yet.
      </div>
    );
  }

  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: "#6b7280" }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: "#9ca3af" }}
            tickFormatter={(v) => `€${v}`}
          />
          <Tooltip
            cursor={{ fill: "rgba(124, 45, 18, 0.04)" }}
            formatter={(v) => [`€${Number(v).toFixed(2)}`, "Revenue"]}
          />
          <Bar
            dataKey="value"
            radius={[10, 10, 0, 0]}
            fill="url(#dashboardRevenueGradient)"
          />
          <defs>
            <linearGradient
              id="dashboardRevenueGradient"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="0%" stopColor="#7B2220" stopOpacity={0.95} />
              <stop offset="100%" stopColor="#F97316" stopOpacity={0.8} />
            </linearGradient>
          </defs>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function OrdersSnapshot({ orders, loading }) {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-10 bg-gray-100 rounded-xl animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (!orders || !orders.length) {
    return (
      <div className="h-40 flex items-center justify-center text-xs text-gray-400">
        No orders yet.
      </div>
    );
  }

  const paymentBuckets = orders.reduce((acc, o) => {
    const method =
      o.orderData?.paymentMethod || o.paymentMethod || "Unknown";
    acc[method] = (acc[method] || 0) + 1;
    return acc;
  }, {});

  const statusBuckets = orders.reduce((acc, o) => {
    const status = o.paymentStatus || "unknown";
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  const totalOrders = orders.length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
          Overview
        </p>
        <p className="text-xs text-gray-500">
          {totalOrders} total orders
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Payment method card */}
        <div className="rounded-2xl border border-gray-100 bg-gradient-to-br from-gray-50 to-white p-4 shadow-sm">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            By Payment Method
          </h4>
          <div className="space-y-2">
            {Object.entries(paymentBuckets).map(([method, count]) => {
              const pct = totalOrders ? (count / totalOrders) * 100 : 0;
              return (
                <div key={method} className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-gray-700">
                    <span>{method}</span>
                    <span className="font-semibold">
                      {count} ({pct.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#0EA5E9] to-[#6366F1]"
                      style={{ width: `${pct || 4}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Status card */}
        <div className="rounded-2xl border border-gray-100 bg-gradient-to-br from-gray-50 to-white p-4 shadow-sm">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            By Status
          </h4>
          <div className="flex flex-wrap gap-2">
            {Object.entries(statusBuckets).map(([status, count]) => {
              const pct = totalOrders ? (count / totalOrders) * 100 : 0;
              const label = status.toLowerCase();

              const colorClasses =
                label === "paid" || label === "delivered"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                  : label === "preparing" || label === "toDelivered"
                  ? "bg-amber-50 text-amber-700 border-amber-100"
                  : "bg-rose-50 text-rose-700 border-rose-100";

              return (
                <div
                  key={status}
                  className={`px-3 py-2 rounded-xl border text-[0.7rem] font-medium flex items-center gap-2 shadow-sm ${colorClasses}`}
                >
                  <span className="capitalize">{label}</span>
                  <span className="text-[0.65rem] opacity-80">
                    {count} • {pct.toFixed(0)}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function LowStockPanel({ products, loading }) {
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900">
            Low Stock Alerts
          </h3>
          <p className="text-xs text-gray-500">
            First {products?.length || 0} products with stock ≤ 5.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-10 bg-gray-100 rounded-xl animate-pulse"
            />
          ))}
        </div>
      ) : !products || !products.length ? (
        <div className="h-28 flex items-center justify-center text-xs text-gray-400">
          No low stock items. 🎉
        </div>
      ) : (
        <div className="space-y-2">
          {products.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between rounded-xl border border-amber-100 bg-amber-50/70 px-3 py-2 text-xs"
            >
              <div className="flex items-center gap-2">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-amber-100 text-[0.7rem] font-semibold text-amber-700">
                  {p.name?.[0] || "P"}
                </span>
                <div>
                  <p className="font-semibold text-gray-800 truncate max-w-[10rem]">
                    {p.name || "Unnamed product"}
                  </p>
                  <p className="text-[0.65rem] text-gray-500">
                    {p.category || "Uncategorized"}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[0.75rem] font-semibold text-amber-800">
                  Limit: {p.dailyLimit ?? 0}
                </p>
                <p className="text-[0.65rem] text-amber-700/80">
                  Reorder soon
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RecentOrdersPanel({ orders, loading }) {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 space-y-2">
        <div className="h-4 w-32 bg-gray-100 rounded-lg animate-pulse" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-9 bg-gray-100 rounded-xl animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (!orders || !orders.length) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 flex items-center justify-center text-xs text-gray-400 h-40">
        No recent orders.
      </div>
    );
  }

  const formatTime = (ts) => {
    if (!ts) return "—";
    const d =
      typeof ts === "object" && ts.seconds
        ? new Date(ts.seconds * 1000)
        : new Date(ts);
    return d.toLocaleString("en-NL", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Recent Orders</h3>
          <p className="text-xs text-gray-500">
            Last {orders.length} orders placed in the system.
          </p>
        </div>
      </div>

      <div className="space-y-2 text-xs">
        {orders.map((o) => {
          const firstItemName = o.items?.[0]?.name || "Unnamed product";
          const extraCount = (o.items?.length || 0) - 1;

          return (
            <div
              key={o.id}
              className="flex items-center justify-between rounded-xl border border-gray-100 px-3 py-2 hover:bg-gray-50 transition-colors"
            >
              <div>
                <p className="font-semibold text-gray-800">
                  {firstItemName}
                </p>
                <p className="text-[0.65rem] text-gray-500">
                  #{o.id.slice(0, 6)}
                  {extraCount > 0 && ` • +${extraCount} more item${extraCount > 1 ? "s" : ""}`}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[0.75rem] font-semibold text-[#502455]">
                  €{Number(o.total ?? o.totalPrice ?? 0).toFixed(2)}
                </p>
                <p className="text-[0.65rem] text-gray-400">
                  {formatTime(o.createdAt)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default AdminDashboard;
