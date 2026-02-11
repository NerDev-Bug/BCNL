// src/components/admin/reports.jsx
import { useEffect, useMemo, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebase";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

function ReportsPage() {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ordersRange, setOrdersRange] = useState("7d"); // 7d | 30d | 365d

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [ordersSnap, productsSnap] = await Promise.all([
          getDocs(collection(db, "orders")),
          getDocs(collection(db, "products")),
        ]);

        setOrders(
          ordersSnap.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          }))
        );

        setProducts(
          productsSnap.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          }))
        );
      } catch (err) {
        console.error("Failed to load reports data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const summary = useMemo(() => {
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce(
      (sum, o) => sum + Number(o.total || 0),
      0
    );
    const avgTicket = totalOrders ? totalRevenue / totalOrders : 0;

    const lowStockCount = products.filter(
      (p) => typeof p.stock === "number" && p.stock <= 5
    ).length;

    // Date range for charts
    const now = new Date();
    const rangeDays =
      ordersRange === "30d" ? 30 : ordersRange === "365d" ? 365 : 7;

    const start = new Date(now);
    start.setDate(now.getDate() - (rangeDays - 1));
    start.setHours(0, 0, 0, 0);

    const dayBuckets = new Map();
    for (let i = rangeDays - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      dayBuckets.set(key, 0);
    }

    const filteredOrders = orders.filter((o) => {
      const ts = o.createdAt;
      if (!ts) return false;
      const date =
        typeof ts === "object" && ts.seconds
          ? new Date(ts.seconds * 1000)
          : new Date(ts);
      return date >= start && date <= now;
    });

    filteredOrders.forEach((o) => {
      const ts = o.createdAt;
      if (!ts) return;

      const date =
        typeof ts === "object" && ts.seconds
          ? new Date(ts.seconds * 1000)
          : new Date(ts);

      const key = date.toISOString().slice(0, 10);

      if (dayBuckets.has(key)) {
        dayBuckets.set(key, dayBuckets.get(key) + 1);
      }
    });

    const ordersOverTime = Array.from(dayBuckets.entries()).map(
      ([key, value]) => {
        const d = new Date(key);
        const label = d.toLocaleDateString("en-US", {
          month: "2-digit",
          day: "2-digit",
        });

        return { key, label, value };
      }
    );

    // Payment method breakdown (same filtered range)
    const paymentBreakdown = filteredOrders.reduce((acc, o) => {
      const method =
        o.orderData?.paymentMethod || o.paymentMethod || "Unknown";
      acc[method] = (acc[method] || 0) + 1;
      return acc;
    }, {});

    return {
      totalOrders,
      totalRevenue,
      avgTicket,
      lowStockCount,
      ordersOverTime,
      paymentBreakdown,
      rangeDays,
    };
  }, [orders, products, ordersRange]);

  const downloadCsv = (rows, filename) => {
    if (!rows || !rows.length) {
      alert("No data to export.");
      return;
    }

    const headers = Object.keys(rows[0]);
    const escape = (val) => {
      if (val == null) return "";
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const csv =
      headers.join(",") +
      "\n" +
      rows
        .map((row) => headers.map((h) => escape(row[h])).join(","))
        .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportOrders = () => {
    const rows = orders.map((o) => ({
      id: o.id,
      createdAt: o.createdAt?.seconds
        ? new Date(o.createdAt.seconds * 1000).toISOString()
        : "",
      customer: o.orderData?.receiverName || "",
      paymentMethod: o.orderData?.paymentMethod || o.paymentMethod || "",
      itemsCount: o.items?.length || 0,
      total: Number(o.total || 0).toFixed(2),
      paymentStatus: o.paymentStatus || "",
    }));

    downloadCsv(rows, "bcnl-orders-report.csv");
  };

  const exportProducts = () => {
    const rows = products.map((p) => ({
      id: p.id,
      name: p.name || "",
      category: p.category || "",
      price: Number(p.price || 0).toFixed(2),
      stock: p.stock ?? "",
      dailyLimit: p.dailyLimit ?? "",
      hasDiscount: p.productDiscount ? "YES" : "NO",
    }));

    downloadCsv(rows, "bcnl-inventory-report.csv");
  };

  const exportOrdersOverTimeCsv = () => {
    const rows = summary.ordersOverTime.map((d) => ({
      date: d.key,
      label: d.label,
      orders: d.value,
    }));
    downloadCsv(rows, `bcnl-orders-trend-${ordersRange}.csv`);
  };

  const exportOrdersOverTimePdf = () => {
    if (!summary.ordersOverTime.length) {
      alert("No data to export for this range.");
      return;
    }

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Orders Over Time", 14, 16);

    doc.setFontSize(11);
    const label =
      ordersRange === "30d"
        ? "Last 30 days"
        : ordersRange === "365d"
        ? "Last 365 days"
        : "Last 7 days";
    doc.text(label, 14, 24);

    autoTable(doc, {
      startY: 32,
      head: [["Date", "Label", "Orders"]],
      body: summary.ordersOverTime.map((d) => [d.key, d.label, d.value]),
    });

    doc.save(`bcnl-orders-trend-${ordersRange}.pdf`);
  };

  const exportPaymentBreakdownCsv = () => {
    const entries = Object.entries(summary.paymentBreakdown || {});
    if (!entries.length) {
      alert("No payment data to export for this range.");
      return;
    }

    const rows = entries.map(([method, count]) => ({
      method,
      count,
    }));

    downloadCsv(rows, `bcnl-payment-methods-${ordersRange}.csv`);
  };

  const exportPaymentBreakdownPdf = () => {
    const entries = Object.entries(summary.paymentBreakdown || {});
    if (!entries.length) {
      alert("No payment data to export for this range.");
      return;
    }

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Payment Method Breakdown", 14, 16);

    doc.setFontSize(11);
    const label =
      ordersRange === "30d"
        ? "Last 30 days"
        : ordersRange === "365d"
        ? "Last 365 days"
        : "Last 7 days";
    doc.text(label, 14, 24);

    autoTable(doc, {
      startY: 32,
      head: [["Method", "Orders"]],
      body: entries.map(([method, count]) => [method, count]),
    });

    doc.save(`bcnl-payment-methods-${ordersRange}.pdf`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* HEADER */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Reports</h1>
          <p className="text-sm text-gray-500 max-w-2xl">
            High-level overview of sales, inventory, and performance. Export
            CSV files for deeper analysis in Excel or your accounting tools.
          </p>
        </div>

        {/* KPI CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <KpiCard
            label="Total Orders"
            value={summary.totalOrders}
            helper="All time orders found in Firestore"
            loading={loading}
          />
          <KpiCard
            label="Total Revenue"
            value={`€${summary.totalRevenue.toFixed(2)}`}
            helper="Sum of all order totals"
            loading={loading}
          />
          <KpiCard
            label="Average Ticket"
            value={`€${summary.avgTicket.toFixed(2)}`}
            helper="Revenue / order count"
            loading={loading}
          />
          <KpiCard
            label="Low Stock Products"
            value={summary.lowStockCount}
            helper="Items with stock ≤ 5"
            loading={loading}
          />
        </div>

        {/* CHARTS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Orders – Time Range
                </h2>
                <p className="text-xs text-gray-500">
                  Count of orders created per day.
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <select
                  value={ordersRange}
                  onChange={(e) => setOrdersRange(e.target.value)}
                  className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#7B2220]/30"
                >
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                  <option value="365d">Last 365 days</option>
                </select>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={exportOrdersOverTimeCsv}
                    className="px-2 py-1 rounded-md border border-gray-200 text-[0.65rem] text-gray-700 hover:bg-gray-50"
                  >
                    CSV
                  </button>
                  <button
                    type="button"
                    onClick={exportOrdersOverTimePdf}
                    className="px-2 py-1 rounded-md border border-gray-200 text-[0.65rem] text-gray-700 hover:bg-gray-50"
                  >
                    PDF
                  </button>
                </div>
              </div>
            </div>
            <WeeklyOrdersChart
              data={summary.ordersOverTime}
              loading={loading}
            />
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-1">
                  Payment Methods
                </h2>
                <p className="text-xs text-gray-500">
                  Distribution of orders by payment method (same range).
                </p>
              </div>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={exportPaymentBreakdownCsv}
                  className="px-2 py-1 rounded-md border border-gray-200 text-[0.65rem] text-gray-700 hover:bg-gray-50"
                >
                  CSV
                </button>
                <button
                  type="button"
                  onClick={exportPaymentBreakdownPdf}
                  className="px-2 py-1 rounded-md border border-gray-200 text-[0.65rem] text-gray-700 hover:bg-gray-50"
                >
                  PDF
                </button>
              </div>
            </div>
            <PaymentMethodChart
              breakdown={summary.paymentBreakdown}
              total={summary.totalOrders}
              loading={loading}
            />
          </div>
        </div>

        {/* EXPORT CARDS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ExportCard
            title="Sales & Orders Report"
            description="Download all POS orders with customer, payment, and total information."
            primaryLabel="Download Orders CSV"
            onPrimary={exportOrders}
            disabled={loading || !orders.length}
          />

          <ExportCard
            title="Inventory Report"
            description="Export current product catalog with pricing, stock, and discount flags."
            primaryLabel="Download Inventory CSV"
            onPrimary={exportProducts}
            disabled={loading || !products.length}
          />
        </div>
      </div>
    </div>
  );
}

function KpiCard({ label, value, helper, loading }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-5 py-4 flex flex-col justify-between min-h-[120px]">
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          {label}
        </p>
        <p className="mt-3 text-2xl font-bold text-[#502455]">
          {loading ? "…" : value}
        </p>
      </div>
      <p className="mt-2 text-xs text-gray-500">{helper}</p>
    </div>
  );
}

function ExportCard({
  title,
  description,
  primaryLabel,
  onPrimary,
  disabled,
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between min-h-[180px]">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        <p className="mt-2 text-sm text-gray-600">{description}</p>
      </div>
      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={onPrimary}
          disabled={disabled}
          className="px-5 py-2.5 rounded-xl bg-[#7B2220] text-white text-sm font-semibold hover:bg-[#8B3230] shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {primaryLabel}
        </button>
      </div>
    </div>
  );
}

function WeeklyOrdersChart({ data, loading }) {
  if (loading) {
    return (
      <div className="h-40 flex items-center justify-center text-xs text-gray-400">
        Loading…
      </div>
    );
  }

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
            allowDecimals={false}
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: "#9ca3af" }}
          />
          <Tooltip
            cursor={{ fill: "rgba(37, 99, 235, 0.04)" }}
            formatter={(v) => [`${v} orders`, "Orders"]}
          />
          <Bar
            dataKey="value"
            radius={[10, 10, 0, 0]}
            fill="url(#reportsOrdersGradient)"
          />
          <defs>
            <linearGradient
              id="reportsOrdersGradient"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="0%" stopColor="#2563EB" stopOpacity={0.95} />
              <stop offset="100%" stopColor="#38BDF8" stopOpacity={0.8} />
            </linearGradient>
          </defs>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function PaymentMethodChart({ breakdown, total, loading }) {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-6 bg-gray-100 rounded-full animate-pulse" />
        ))}
      </div>
    );
  }

  const entries = Object.entries(breakdown || {});
  if (!entries.length) {
    return (
      <div className="h-40 flex items-center justify-center text-xs text-gray-400">
        No payment data yet.
      </div>
    );
  }

  const data = entries.map(([method, count]) => ({
    name: method,
    value: count,
  }));

  const colors = ["#16A34A", "#22C55E", "#84CC16", "#0EA5E9", "#F97316"];

  return (
    <div className="h-56 flex">
      <ResponsiveContainer width="60%" height="100%">
        <PieChart>
          <Tooltip
            formatter={(v, _n, p) => [
              `${v} orders (${((v / total) * 100 || 0).toFixed(1)}%)`,
              p.payload.name,
            ]}
          />
          <Legend
            verticalAlign="bottom"
            height={28}
            iconSize={8}
            wrapperStyle={{ fontSize: 11 }}
          />
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="45%"
            outerRadius="70%"
            innerRadius="45%"
            paddingAngle={2}
          >
            {data.map((entry, index) => (
              <Cell
                key={entry.name}
                fill={colors[index % colors.length]}
                stroke="white"
                strokeWidth={1}
              />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>

      <div className="flex-1 pl-4 flex flex-col justify-center gap-2 text-xs text-gray-700">
        {data.map((item, index) => {
          const pct = total ? (item.value / total) * 100 : 0;
          return (
            <div key={item.name} className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: colors[index % colors.length] }}
                />
                {item.name}
              </span>
              <span className="font-semibold">
                {item.value} ({pct.toFixed(1)}%)
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ReportsPage;

