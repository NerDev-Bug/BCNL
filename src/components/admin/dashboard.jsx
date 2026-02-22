import { useEffect, useMemo, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebase";
import {
  CubeIcon,
  ShoppingBagIcon,
  CreditCardIcon,
  BanknotesIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
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
import { downloadCsv } from "./DownloadCSV-PDF";

function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [productsCount, setProductsCount] = useState(0);
  const [customersCount, setCustomersCount] = useState(0);

  // Date range for revenue chart
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 6);
    return date.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [ordersSnap, productsSnap, usersSnap] = await Promise.all([
          getDocs(collection(db, "orders")),
          getDocs(collection(db, "products")),
          getDocs(collection(db, "users")),
        ]);

        const ordersData = ordersSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        const productsData = productsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

        setOrders(ordersData);
        setProducts(productsData);
        setProductsCount(productsData.length);

        const customersOnly = usersSnap.docs
          .map((d) => d.data())
          .filter((u) => String(u.role || "customer").toLowerCase() === "customer");
        setCustomersCount(customersOnly.length);
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // ─── Timestamp helper ───────────────────────────────────────────────────────
  const getDate = (ts) => {
    if (!ts) return null;
    if (typeof ts === "object" && ts.seconds) return new Date(ts.seconds * 1000);
    const d = new Date(ts);
    return isNaN(d.getTime()) ? null : d;
  };

  const todayKey = useMemo(() => new Date().toISOString().slice(0, 10), []);

  // ─── Core metrics ────────────────────────────────────────────────────────────
  const metrics = useMemo(() => {
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((s, o) => s + Number(o.total ?? o.totalPrice ?? 0), 0);

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    if (start > end) {
      return { totalOrders, totalRevenue, todayRevenue: 0, todayOrders: 0, rangeRevenue: 0, rangeSeries: [], pendingCount: 0 };
    }

    let todayRevenue = 0;
    let todayOrders = 0;
    let rangeRevenue = 0;
    let pendingCount = 0;
    const dayBuckets = new Map();

    const cur = new Date(start);
    while (cur <= end) {
      dayBuckets.set(cur.toISOString().slice(0, 10), 0);
      cur.setDate(cur.getDate() + 1);
    }

    orders.forEach((o) => {
      const d = getDate(o.createdAt);
      if (!d) return;
      const key = d.toISOString().slice(0, 10);
      const amount = Number(o.total ?? o.totalPrice ?? 0);

      if (key === todayKey) {
        todayRevenue += amount;
        todayOrders += 1;
      }
      if (d >= start && d <= end) {
        rangeRevenue += amount;
        if (dayBuckets.has(key)) dayBuckets.set(key, dayBuckets.get(key) + amount);
      }
      if (o.paymentStatus === "paid") pendingCount += 1;
    });

    const rangeSeries = Array.from(dayBuckets.entries())
      .map(([key, value]) => ({
        key,
        label: new Date(key).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
        value,
      }))
      .sort((a, b) => a.key.localeCompare(b.key));

    return { totalOrders, totalRevenue, todayRevenue, todayOrders, rangeRevenue, rangeSeries, pendingCount };
  }, [orders, startDate, endDate, todayKey]);

  // ─── Inventory health ────────────────────────────────────────────────────────
  const inventoryHealth = useMemo(() => {
    const available = products.filter((p) => p.available !== false).length;
    const soldOut = products.filter((p) => p.available === false).length;
    const lowStock = products.filter(
      (p) => typeof p.dailyLimit === "number" && p.dailyLimit > 0 && p.dailyLimit <= 5
    ).length;
    return { available, soldOut, lowStock };
  }, [products]);

  // ─── Today's fulfillment ────────────────────────────────────────────────────
  const todayFulfillment = useMemo(() => {
    const todayOrders = orders.filter((o) => {
      const d = getDate(o.createdAt);
      return d && d.toISOString().slice(0, 10) === todayKey;
    });
    const counts = { paid: 0, preparing: 0, to_delivered: 0, delivered: 0, returned: 0, other: 0 };
    todayOrders.forEach((o) => {
      const s = o.paymentStatus;
      if (counts[s] !== undefined) counts[s] += 1;
      else counts.other += 1;
    });
    return { total: todayOrders.length, counts };
  }, [orders, todayKey]);

  // ─── Top selling products ────────────────────────────────────────────────────
  const topSellingProducts = useMemo(() => {
    const salesMap = {};
    orders.forEach((o) => {
      (o.items || []).forEach((item) => {
        const key = item.productId || item.name;
        if (!salesMap[key]) salesMap[key] = { name: item.name, qty: 0, revenue: 0 };
        salesMap[key].qty += item.quantity || 1;
        salesMap[key].revenue += (item.price || 0) * (item.quantity || 1);
      });
    });
    return Object.values(salesMap)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);
  }, [orders]);

  // ─── Low stock (top 5) ────────────────────────────────────────────────────────
  const lowStockProducts = useMemo(
    () =>
      products
        .filter((p) => typeof p.dailyLimit === "number" && p.dailyLimit <= 5 && p.dailyLimit > 0)
        .sort((a, b) => (a.dailyLimit ?? 0) - (b.dailyLimit ?? 0))
        .slice(0, 5),
    [products]
  );

  // ─── Recent orders (last 5) ─────────────────────────────────────────────────
  const recentOrders = useMemo(() => {
    const getTime = (ts) => {
      if (!ts) return 0;
      if (ts.seconds) return ts.seconds * 1000 + (ts.nanoseconds || 0) / 1e6;
      const d = new Date(ts);
      return isNaN(d.getTime()) ? 0 : d.getTime();
    };
    return [...orders].sort((a, b) => getTime(b.createdAt) - getTime(a.createdAt)).slice(0, 5);
  }, [orders]);

  // ─── KPI cards ──────────────────────────────────────────────────────────────
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
      label: "Orders Today",
      value: loading ? "…" : metrics.todayOrders.toString(),
      icon: ClockIcon,
      gradient: "from-sky-500 to-sky-600",
      bgGradient: "from-sky-50 to-sky-100",
      iconBg: "bg-sky-100",
      iconColor: "text-sky-600",
    },
    {
      label: "Revenue Today",
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
    {
      label: "Available Products",
      value: loading ? "…" : inventoryHealth.available.toString(),
      icon: CheckCircleIcon,
      gradient: "from-emerald-500 to-emerald-600",
      bgGradient: "from-emerald-50 to-emerald-100",
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-600",
      sub: loading ? null : `${inventoryHealth.soldOut} sold out · ${inventoryHealth.lowStock} low`,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-3 sm:p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto w-full min-w-0 space-y-6">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-1">BCNL Dashboard</h1>
          <p className="text-xs sm:text-sm text-gray-500">
            Real-time overview of sales, orders, and inventory health.
          </p>
        </div>

        {/* ── Pending Orders Alert ────────────────────────────────────────── */}
        {!loading && metrics.pendingCount > 0 && (
          <div className="flex items-center gap-4 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 shadow-sm">
            <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-xl bg-amber-100">
              <ExclamationTriangleIcon className="w-5 h-5 text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-amber-800">
                {metrics.pendingCount} order{metrics.pendingCount !== 1 ? "s" : ""} waiting for action
              </p>
              <p className="text-xs text-amber-600 mt-0.5">
                These paid orders need to be accepted and moved to preparing.
              </p>
            </div>
            <a
              href="/admin/orders"
              className="flex-shrink-0 px-4 py-2 bg-amber-500 text-white text-xs font-semibold rounded-lg hover:bg-amber-600 transition-colors"
            >
              View Orders
            </a>
          </div>
        )}

        {/* ── KPI Cards ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className="group bg-white p-5 rounded-2xl shadow-sm border border-gray-100
                  transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-[#7B2220]/20
                  relative overflow-hidden"
              >
                <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${stat.bgGradient} opacity-10 rounded-full blur-2xl -mr-12 -mt-12`} />
                <div className="relative">
                  <div className={`${stat.iconBg} p-2.5 rounded-xl w-fit mb-3 transition-transform duration-300 group-hover:scale-110`}>
                    <Icon className={`w-5 h-5 ${stat.iconColor}`} />
                  </div>
                  <p className="text-gray-500 text-xs font-medium mb-1">{stat.label}</p>
                  <h2 className="text-2xl font-bold text-gray-900">{stat.value}</h2>
                  {stat.sub && (
                    <p className="text-[0.65rem] text-gray-400 mt-1">{stat.sub}</p>
                  )}
                </div>
                <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ${stat.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
              </div>
            );
          })}
        </div>

        {/* ── Revenue Chart + Orders Snapshot ────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Chart */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4 gap-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Revenue Report</h3>
                <p className="text-xs text-gray-500">All orders grouped per day.</p>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <div className="flex flex-col">
                    <label className="text-xs text-gray-500 mb-1">Start</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      max={endDate}
                      className="px-2 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#7B2220]"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-xs text-gray-500 mb-1">End</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      min={startDate}
                      max={new Date().toISOString().split("T")[0]}
                      className="px-2 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#7B2220]"
                    />
                  </div>
                </div>
                <button
                  onClick={() => {
                    const rows = metrics.rangeSeries.map((item) => ({
                      Date: item.key,
                      Day: item.label,
                      Revenue: `€${item.value.toFixed(2)}`,
                      "Revenue (Number)": item.value.toFixed(2),
                    }));
                    const dateRangeStr = `${startDate}_to_${endDate}`;
                    const today = new Date();
                    const downloadDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
                    downloadCsv(rows, `bcnl-revenue-report-${dateRangeStr}-${downloadDate}.csv`);
                  }}
                  className="px-3 py-1.5 bg-[#7B2220] text-white rounded-lg text-xs font-semibold hover:bg-[#8B3230] transition-colors flex items-center gap-1.5"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export CSV
                </button>
              </div>
            </div>
            <div className="mb-3 text-right">
              <p className="text-xs text-gray-400 uppercase tracking-wide">
                Total ({startDate} → {endDate})
              </p>
              <p className="text-lg font-semibold text-[#502455]">
                {loading ? "…" : `€${metrics.rangeRevenue.toFixed(2)}`}
              </p>
            </div>
            <WeeklyBarChart data={metrics.rangeSeries} />
          </div>

          {/* Orders Snapshot */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Orders Snapshot</h3>
            <OrdersSnapshot orders={orders} loading={loading} />
          </div>
        </div>

        {/* ── Today's Fulfillment + Top Selling ──────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Today's Fulfillment */}
          <TodayFulfillment data={todayFulfillment} loading={loading} />

          {/* Top Selling Products */}
          <TopSellingProducts products={topSellingProducts} loading={loading} />
        </div>

        {/* ── Low Stock + Recent Orders ───────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <LowStockPanel products={lowStockProducts} loading={loading} />
          <RecentOrdersPanel orders={recentOrders} loading={loading} />
        </div>

      </div>
    </div>
  );
}

// ─── WeeklyBarChart ───────────────────────────────────────────────────────────
function WeeklyBarChart({ data }) {
  if (!data || !data.length) {
    return (
      <div className="h-40 flex items-center justify-center text-xs text-gray-400">
        No data for this range.
      </div>
    );
  }

  return (
    <div className="h-52" style={{ minHeight: 0 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: "#6b7280" }} />
          <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: "#9ca3af" }} tickFormatter={(v) => `€${v}`} />
          <Tooltip cursor={{ fill: "rgba(124,45,18,0.04)" }} formatter={(v) => [`€${Number(v).toFixed(2)}`, "Revenue"]} />
          <Bar dataKey="value" radius={[8, 8, 0, 0]} fill="#7B2220" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── OrdersSnapshot ───────────────────────────────────────────────────────────
function OrdersSnapshot({ orders, loading }) {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-10 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (!orders?.length) {
    return <div className="h-40 flex items-center justify-center text-xs text-gray-400">No orders yet.</div>;
  }

  const paymentBuckets = orders.reduce((acc, o) => {
    const method = o.orderData?.paymentMethod || o.paymentMethod || "Unknown";
    acc[method] = (acc[method] || 0) + 1;
    return acc;
  }, {});

  const statusBuckets = orders.reduce((acc, o) => {
    const status = o.paymentStatus || "unknown";
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  const totalOrders = orders.length;

  const statusColor = (s) => {
    const l = s.toLowerCase();
    if (l === "paid" || l === "delivered") return "bg-emerald-50 text-emerald-700 border-emerald-100";
    if (l === "preparing" || l === "to_delivered") return "bg-amber-50 text-amber-700 border-amber-100";
    if (l === "return_requested" || l === "returned") return "bg-rose-50 text-rose-700 border-rose-100";
    return "bg-gray-50 text-gray-600 border-gray-200";
  };

  return (
    <div className="space-y-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{totalOrders} total orders</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-gray-100 bg-gradient-to-br from-gray-50 to-white p-4 shadow-sm">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">By Payment Method</h4>
          <div className="space-y-2">
            {Object.entries(paymentBuckets).map(([method, count]) => {
              const pct = totalOrders ? (count / totalOrders) * 100 : 0;
              return (
                <div key={method} className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-gray-700">
                    <span>{method}</span>
                    <span className="font-semibold">{count} ({pct.toFixed(0)}%)</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-gray-100 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#0EA5E9] to-[#6366F1]" style={{ width: `${pct || 4}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-gradient-to-br from-gray-50 to-white p-4 shadow-sm">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">By Status</h4>
          <div className="flex flex-wrap gap-2">
            {Object.entries(statusBuckets).map(([status, count]) => {
              const pct = totalOrders ? (count / totalOrders) * 100 : 0;
              return (
                <div key={status} className={`px-3 py-2 rounded-xl border text-[0.7rem] font-medium flex items-center gap-2 shadow-sm ${statusColor(status)}`}>
                  <span className="capitalize">{status.replace("_", " ")}</span>
                  <span className="text-[0.65rem] opacity-80">{count} · {pct.toFixed(0)}%</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── TodayFulfillment ─────────────────────────────────────────────────────────
function TodayFulfillment({ data, loading }) {
  const statusConfig = [
    { key: "paid",         label: "Awaiting",    color: "bg-amber-400" },
    { key: "preparing",    label: "Preparing",   color: "bg-blue-400" },
    { key: "to_delivered", label: "To Deliver",  color: "bg-indigo-400" },
    { key: "delivered",    label: "Delivered",   color: "bg-emerald-500" },
    { key: "returned",     label: "Returned",    color: "bg-rose-400" },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-gray-900">Today's Fulfillment</h3>
        <p className="text-xs text-gray-500">Order status breakdown for today.</p>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-8 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : data.total === 0 ? (
        <div className="h-28 flex items-center justify-center text-xs text-gray-400">
          No orders yet today.
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-2xl font-bold text-gray-900">
            {data.total} <span className="text-sm font-normal text-gray-400">orders today</span>
          </p>
          {statusConfig.map(({ key, label, color }) => {
            const count = data.counts[key] || 0;
            const pct = data.total ? (count / data.total) * 100 : 0;
            return (
              <div key={key} className="space-y-1">
                <div className="flex items-center justify-between text-xs text-gray-700">
                  <span className="font-medium">{label}</span>
                  <span className="font-semibold">{count} ({pct.toFixed(0)}%)</span>
                </div>
                <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div className={`h-full rounded-full ${color} transition-all duration-500`} style={{ width: `${pct || 0}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── TopSellingProducts ───────────────────────────────────────────────────────
function TopSellingProducts({ products, loading }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-gray-900">Top Selling Products</h3>
        <p className="text-xs text-gray-500">Ranked by total units sold across all orders.</p>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-10 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : !products?.length ? (
        <div className="h-28 flex items-center justify-center text-xs text-gray-400">
          No sales data yet.
        </div>
      ) : (
        <div className="space-y-2">
          {products.map((p, index) => {
            const maxQty = products[0]?.qty || 1;
            const pct = (p.qty / maxQty) * 100;
            const medals = ["🥇", "🥈", "🥉"];
            return (
              <div key={`${p.name}-${index}`} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                <span className="text-base w-6 text-center flex-shrink-0">
                  {medals[index] || <span className="text-xs font-bold text-gray-400">#{index + 1}</span>}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-800 truncate">{p.name}</p>
                  <div className="w-full h-1.5 mt-1 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#7B2220] to-[#502455] transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs font-bold text-gray-900">{p.qty} sold</p>
                  <p className="text-[0.65rem] text-gray-400">€{p.revenue.toFixed(2)}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── LowStockPanel ────────────────────────────────────────────────────────────
function LowStockPanel({ products, loading }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Low Stock Alerts</h3>
          <p className="text-xs text-gray-500">Products with dailyLimit ≤ 5.</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-10 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : !products?.length ? (
        <div className="h-28 flex items-center justify-center text-xs text-gray-400">
          No low stock items. 🎉
        </div>
      ) : (
        <div className="space-y-2">
          {products.map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded-xl border border-amber-100 bg-amber-50/70 px-3 py-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-amber-100 text-[0.7rem] font-semibold text-amber-700">
                  {p.name?.[0] || "P"}
                </span>
                <div>
                  <p className="font-semibold text-gray-800 truncate max-w-[10rem]">{p.name || "Unnamed"}</p>
                  <p className="text-[0.65rem] text-gray-500">{p.category || "Uncategorized"}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[0.75rem] font-semibold text-amber-800">Limit: {p.dailyLimit ?? 0}</p>
                <p className="text-[0.65rem] text-amber-700/80">Reorder soon</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── RecentOrdersPanel ────────────────────────────────────────────────────────
function RecentOrdersPanel({ orders, loading }) {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-2">
        <div className="h-4 w-32 bg-gray-100 rounded-lg animate-pulse" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-9 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (!orders?.length) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center justify-center text-xs text-gray-400 h-40">
        No recent orders.
      </div>
    );
  }

  const formatTime = (ts) => {
    if (!ts) return "—";
    const d = typeof ts === "object" && ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
    return d.toLocaleString("en-NL", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
  };

  const statusDot = (status) => {
    const s = (status || "").toLowerCase();
    if (s === "delivered") return "bg-emerald-500";
    if (s === "paid") return "bg-amber-400";
    if (s === "preparing") return "bg-blue-400";
    if (s === "to_delivered") return "bg-indigo-400";
    return "bg-gray-400";
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Recent Orders</h3>
          <p className="text-xs text-gray-500">Last {orders.length} orders placed.</p>
        </div>
      </div>
      <div className="space-y-2 text-xs">
        {orders.map((o) => {
          const firstItemName = o.items?.[0]?.name || "Unnamed product";
          const extraCount = (o.items?.length || 0) - 1;
          return (
            <div key={o.id} className="flex items-center justify-between rounded-xl border border-gray-100 px-3 py-2 hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-2 min-w-0">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${statusDot(o.paymentStatus)}`} />
                <div className="min-w-0">
                  <p className="font-semibold text-gray-800 truncate">{firstItemName}</p>
                  <p className="text-[0.65rem] text-gray-500">
                    #{o.id.slice(0, 6)}
                    {extraCount > 0 && ` · +${extraCount} more`}
                  </p>
                </div>
              </div>
              <div className="text-right flex-shrink-0 ml-3">
                <p className="text-[0.75rem] font-semibold text-[#502455]">
                  €{Number(o.total ?? o.totalPrice ?? 0).toFixed(2)}
                </p>
                <p className="text-[0.65rem] text-gray-400">{formatTime(o.createdAt)}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default AdminDashboard;
