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
import StarRating from "../common/StarRating";
import {
  downloadCsv,
  downloadPdfFromTable,
  InventoryReportModal,
  SalesOrdersReportModal,
} from "./DownloadCSV-PDF";

function ReportsPage() {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ordersRange, setOrdersRange] = useState("7d"); // 7d | 30d | 365d

  // Inventory report: editable before download
  const [inventoryModalOpen, setInventoryModalOpen] = useState(false);
  const [inventoryRows, setInventoryRows] = useState([]);

  // Sales & Orders report modal
  const [ordersModalOpen, setOrdersModalOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [ordersSnap, productsSnap, ratingsSnap] = await Promise.all([
          getDocs(collection(db, "orders")),
          getDocs(collection(db, "products")),
          getDocs(collection(db, "ratings")),
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

        setRatings(
          ratingsSnap.docs.map((d) => {
            const data = d.data();
            let createdAt = new Date();
            if (data.createdAt?.toDate) {
              createdAt = data.createdAt.toDate();
            } else if (data.createdAt?.seconds) {
              createdAt = new Date(data.createdAt.seconds * 1000);
            }
            return {
              id: d.id,
              ...data,
              createdAt,
            };
          })
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

    const lowStockProducts = products
      .filter((p) => typeof p.dailyLimit === "number" && p.dailyLimit <= 5 && p.dailyLimit > 0)
      .sort((a, b) => (a.dailyLimit ?? 0) - (b.dailyLimit ?? 0))
      .slice(0, 999); // limit to 999 items for performance
    
    const lowStockCount = lowStockProducts.length;

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

    // Calculate rating statistics
    const ratingStats = ratings.reduce((acc, r) => {
      const rating = r.rating || 0;
      acc.total += 1;
      acc.sum += rating;
      acc.distribution[rating] = (acc.distribution[rating] || 0) + 1;
      return acc;
    }, {
      total: 0,
      sum: 0,
      distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    });

    const averageRating = ratingStats.total > 0 
      ? ratingStats.sum / ratingStats.total 
      : 0;

    // Calculate returned orders statistics
    const returnedOrders = orders.filter(
      (o) => o.paymentStatus === "return_requested" || o.paymentStatus === "returned"
    );

    const returnedOrdersStats = {
      total: returnedOrders.length,
      pending: returnedOrders.filter((o) => o.paymentStatus === "return_requested").length,
      approved: returnedOrders.filter((o) => o.paymentStatus === "returned").length,
      totalValue: returnedOrders.reduce((sum, o) => sum + Number(o.total || 0), 0),
    };

    // Returned orders over time
    const returnedDayBuckets = new Map();
    for (let i = rangeDays - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      returnedDayBuckets.set(key, { pending: 0, approved: 0, total: 0 });
    }

    returnedOrders.forEach((o) => {
      const ts = o.returnRequestedAt || o.createdAt;
      if (!ts) return;

      const date =
        typeof ts === "object" && ts.seconds
          ? new Date(ts.seconds * 1000)
          : new Date(ts);
      const key = date.toISOString().slice(0, 10);

      if (returnedDayBuckets.has(key)) {
        const bucket = returnedDayBuckets.get(key);
        bucket.total += 1;
        if (o.paymentStatus === "return_requested") {
          bucket.pending += 1;
        } else if (o.paymentStatus === "returned") {
          bucket.approved += 1;
        }
      }
    });

    const returnedOrdersOverTime = Array.from(returnedDayBuckets.entries()).map(
      ([key, value]) => {
        const d = new Date(key);
        const label = d.toLocaleDateString("en-US", {
          month: "2-digit",
          day: "2-digit",
        });

        return { key, label, ...value };
      }
    );

    // Payment method breakdown (all-time)
    const paymentBreakdown = orders.reduce((acc, o) => {
      const m = o.orderData?.paymentMethod || o.paymentMethod || "Unknown";
      acc[m] = (acc[m] || 0) + 1;
      return acc;
    }, {});

    return {
      totalOrders,
      totalRevenue,
      avgTicket,
      lowStockCount,
      lowStockProducts,
      ordersOverTime,
      returnedOrdersStats,
      returnedOrdersOverTime,
      paymentBreakdown,
      ratingStats: {
        average: averageRating,
        total: ratingStats.total,
        distribution: ratingStats.distribution,
      },
      rangeDays,
    };
  }, [orders, products, ordersRange, ratings]);

  const formatDateTime = (timestamp) => {
    if (!timestamp) return "";
    
    const date =
      typeof timestamp === "object" && timestamp.seconds
        ? new Date(timestamp.seconds * 1000)
        : new Date(timestamp);
    
    if (Number.isNaN(date.getTime())) return "";
    
    // Format: "February 12, 2026 at 6:34AM"
    const month = date.toLocaleString("en-US", { month: "long" });
    const day = date.getDate();
    const year = date.getFullYear();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    
    // Convert to 12-hour format
    const hour12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    const ampm = hours >= 12 ? "PM" : "AM";
    const minutesStr = minutes.toString().padStart(2, "0");
    
    return `${month} ${day}, ${year} at ${hour12}:${minutesStr}${ampm}`;
  };

  const getCurrentDateString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const openInventoryReportModal = () => {
    const rows = products.map((p) => ({
      name: p.name || "",
      category: p.category || "",
      price: String(Number(p.price || 0).toFixed(2)),
      dailyLimit: p.dailyLimit != null && p.dailyLimit !== "" ? String(p.dailyLimit) : "",
      hasDiscount: p.productDiscount ? "YES" : "NO",
    }));
    setInventoryRows(rows);
    setInventoryModalOpen(true);
  };

  const updateInventoryRow = (index, field, value) => {
    setInventoryRows((prev) => {
      const next = prev.map((row, i) =>
        i === index ? { ...row, [field]: value } : row
      );
      return next;
    });
  };

  const exportInventoryCsvFromModal = () => {
    // Map keys to proper header names
    const rowsWithHeaders = inventoryRows.map((row) => ({
      Name: row.name,
      Category: row.category,
      Price: row.price,
      "Daily Limit": row.dailyLimit,
      "Has Discount": row.hasDiscount,
    }));
    const dateStr = getCurrentDateString();
    downloadCsv(rowsWithHeaders, `bcnl-inventory-report-${dateStr}.csv`);
    setInventoryModalOpen(false);
  };

  const exportInventoryPdfFromModal = () => {
    // Map keys to proper header names
    const rowsWithHeaders = inventoryRows.map((row) => ({
      Name: row.name,
      Category: row.category,
      Price: row.price,
      "Daily Limit": row.dailyLimit,
      "Has Discount": row.hasDiscount,
    }));
    const dateStr = getCurrentDateString();
    downloadPdfFromTable(rowsWithHeaders, {
      title: "Inventory Report",
      filename: `bcnl-inventory-report-${dateStr}.pdf`,
    });
    setInventoryModalOpen(false);
  };

  const exportReturnedOrdersCsv = () => {
    const returnedOrders = orders.filter(
      (o) => o.paymentStatus === "return_requested" || o.paymentStatus === "returned"
    );

    const rows = returnedOrders.map((o) => {
      const createdAt = o.createdAt?.seconds
        ? new Date(o.createdAt.seconds * 1000).toISOString()
        : "";
      const returnRequestedAt = o.returnRequestedAt?.seconds
        ? new Date(o.returnRequestedAt.seconds * 1000).toISOString()
        : "";
      const returnRejectedAt = o.returnRejectedAt?.seconds
        ? new Date(o.returnRejectedAt.seconds * 1000).toISOString()
        : "";

      return {
        orderId: o.id,
        orderDate: createdAt,
        customer: o.orderData?.receiverName || "",
        contact: o.orderData?.contactNumber || "",
        email: o.email || "",
        paymentMethod: o.orderData?.paymentMethod || o.paymentMethod || "",
        total: o.total || 0,
        status: o.paymentStatus === "return_requested" ? "Pending Approval" : "Returned",
        returnReason: o.returnReason || "",
        returnRequestedAt: returnRequestedAt,
        returnRejectedAt: returnRejectedAt || "",
        items: o.items?.map((item) => `${item.name} (x${item.quantity})`).join("; ") || "",
      };
    });

    downloadCsv(rows, `returned-orders-${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const exportOrdersOverTimeCsv = () => {
    const rows = summary.ordersOverTime.map((d) => ({
      date: d.key,
      label: d.label,
      orders: d.value,
    }));
    const dateStr = getCurrentDateString();
    downloadCsv(rows, `bcnl-orders-trend-${ordersRange}-${dateStr}.csv`);
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

    const dateStr = getCurrentDateString();
    doc.save(`bcnl-orders-trend-${ordersRange}-${dateStr}.pdf`);
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-3 sm:p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto w-full min-w-0 space-y-6 md:space-y-8">
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
            helper="Items with dailyLimit ≤ 5"
            loading={loading}
            variant={summary.lowStockCount > 0 ? "warning" : "default"}
          />
        </div>

        {/* ORDERS – TIME RANGE (full width) */}
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

        {/* WEBSITE RATING + LOW STOCK ALERTS (side by side) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="mb-3">
              <h2 className="text-lg font-semibold text-gray-900 mb-1">
                Website Rating
              </h2>
              <p className="text-xs text-gray-500">
                Average rating and distribution of customer ratings.
              </p>
            </div>
            <RatingChart
              ratingStats={summary.ratingStats}
              loading={loading}
            />
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <LowStockPanel
              products={summary.lowStockProducts}
              loading={loading}
            />
          </div>
        </div>

        {/* RETURNED ORDERS REPORT */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Returned Orders Report
              </h2>
              <p className="text-xs text-gray-500">
                Overview of return requests and approved returns.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={exportReturnedOrdersCsv}
                className="px-3 py-1.5 rounded-md border border-gray-200 text-xs text-gray-700 hover:bg-gray-50"
                disabled={loading || !summary.returnedOrdersStats.total}
              >
                Export CSV
              </button>
            </div>
          </div>

          {/* Returned Orders Statistics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-red-50 border border-red-100 rounded-xl p-4">
              <p className="text-xs text-red-600 font-medium mb-1">Total Returns</p>
              <p className="text-2xl font-bold text-red-700">
                {loading ? "…" : summary.returnedOrdersStats.total}
              </p>
              <p className="text-xs text-red-600 mt-1">
                €{loading ? "…" : summary.returnedOrdersStats.totalValue.toFixed(2)} value
              </p>
            </div>
            <div className="bg-orange-50 border border-orange-100 rounded-xl p-4">
              <p className="text-xs text-orange-600 font-medium mb-1">Pending Approval</p>
              <p className="text-2xl font-bold text-orange-700">
                {loading ? "…" : summary.returnedOrdersStats.pending}
              </p>
              <p className="text-xs text-orange-600 mt-1">Awaiting review</p>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <p className="text-xs text-gray-600 font-medium mb-1">Approved Returns</p>
              <p className="text-2xl font-bold text-gray-700">
                {loading ? "…" : summary.returnedOrdersStats.approved}
              </p>
              <p className="text-xs text-gray-600 mt-1">Processed</p>
            </div>
          </div>

          {/* Returned Orders Chart */}
          <ReturnedOrdersChart
            data={summary.returnedOrdersOverTime}
            loading={loading}
          />
        </div>

        {/* EXPORT CARDS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ExportCard
            title="Sales & Orders Report"
            description="Select date range, edit the report content, then download as CSV or PDF."
            primaryLabel="Edit & Download Orders"
            onPrimary={() => setOrdersModalOpen(true)}
            disabled={loading || !orders.length}
          />

          <ExportCard
            title="Inventory Report"
            description="Edit the report content below, then download as CSV."
            primaryLabel="Edit & Download Inventory"
            onPrimary={openInventoryReportModal}
            disabled={loading || !products.length}
          />
        </div>

        {/* Sales & Orders Report – Edit before download modal */}
        {ordersModalOpen && (
          <SalesOrdersReportModal
            orders={orders}
            formatDateTime={formatDateTime}
            onClose={() => setOrdersModalOpen(false)}
            onDownloadCsv={(rowsWithHeaders) => {
              const dateStr = getCurrentDateString();
              downloadCsv(rowsWithHeaders, `bcnl-orders-report-${dateStr}.csv`);
              setOrdersModalOpen(false);
            }}
            onDownloadPdf={(rowsWithHeaders) => {
              const dateStr = getCurrentDateString();
              downloadPdfFromTable(rowsWithHeaders, {
                title: "Sales & Orders Report",
                filename: `bcnl-orders-report-${dateStr}.pdf`,
              });
              setOrdersModalOpen(false);
            }}
          />
        )}

        {/* Inventory Report – Edit before download modal */}
        {inventoryModalOpen && (
          <InventoryReportModal
            rows={inventoryRows}
            onUpdateRow={updateInventoryRow}
            onClose={() => setInventoryModalOpen(false)}
            onDownloadCsv={exportInventoryCsvFromModal}
            onDownloadPdf={exportInventoryPdfFromModal}
          />
        )}
      </div>
    </div>
  );
}

function KpiCard({ label, value, helper, loading, variant = "default" }) {
  const variantStyles = {
    default: {
      border: "border-gray-100",
      valueColor: "text-[#502455]",
      bgGradient: "",
    },
    warning: {
      border: "border-orange-200",
      valueColor: "text-orange-600",
      bgGradient: "bg-gradient-to-br from-orange-50/50 to-transparent",
    },
    success: {
      border: "border-green-200",
      valueColor: "text-green-600",
      bgGradient: "bg-gradient-to-br from-green-50/50 to-transparent",
    },
  };

  const styles = variantStyles[variant] || variantStyles.default;

  return (
    <div
      className={`bg-white rounded-2xl shadow-sm border ${styles.border} px-5 py-4 flex flex-col justify-between min-h-[120px] relative overflow-hidden ${styles.bgGradient}`}
    >
      <div className="relative z-10">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          {label}
        </p>
        <p className={`mt-3 text-2xl font-bold ${styles.valueColor}`}>
          {loading ? "…" : value}
        </p>
      </div>
      <p className="mt-2 text-xs text-gray-500 relative z-10">{helper}</p>
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

function RatingChart({ ratingStats, loading }) {
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-20 bg-gray-100 rounded-xl animate-pulse" />
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-6 bg-gray-100 rounded-full animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!ratingStats || ratingStats.total === 0) {
    return (
      <div className="h-40 flex flex-col items-center justify-center text-xs text-gray-400">
        <p className="mb-2">No ratings yet.</p>
        <p className="text-[0.65rem]">Customers can rate the website monthly.</p>
      </div>
    );
  }

  const { average, total, distribution } = ratingStats;

  return (
    <div className="space-y-4">
      {/* Average Rating Display */}
      <div className="flex flex-col items-center justify-center py-4 bg-gradient-to-br from-[#7B2220]/5 to-[#502455]/5 rounded-xl">
        <p className="text-xs text-gray-600 mb-1.5">Average Rating</p>
        <div className="flex items-center gap-2">
          <StarRating rating={average} size="md" color="primary" />
          <div className="text-left">
            <p className="text-2xl font-bold text-gray-900">{average.toFixed(1)}</p>
            <p className="text-[10px] text-gray-500">out of 5.0</p>
          </div>
        </div>
        <p className="text-[10px] text-gray-500 mt-2">
          Based on {total} rating{total !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Rating Distribution - Pie Chart */}
      <div>
        <h4 className="text-xs font-semibold text-gray-700 mb-3">Rating Distribution</h4>
        
        {/* Check if there's actual distribution (more than one rating category) */}
        {Object.values(distribution).filter(count => count > 0).length <= 1 ? (
          <div className="flex flex-col items-center justify-center py-4 px-3 bg-gray-50 rounded-xl border border-gray-200">
            <div className="text-center mb-3">
              <p className="text-xs text-gray-600 mb-1">All ratings are {average === 5 ? "5 stars" : average === 4 ? "4 stars" : average === 3 ? "3 stars" : average === 2 ? "2 stars" : "1 star"} ⭐</p>
              <p className="text-[10px] text-gray-500">Distribution will appear when ratings vary</p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = distribution[star] || 0;
                const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : "0.0";
                const isActive = count > 0;
                return (
                  <div
                    key={star}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border ${
                      isActive
                        ? "bg-green-50 border-green-200"
                        : "bg-gray-50 border-gray-200"
                    }`}
                  >
                    <span className="text-[10px] font-medium text-gray-700">{star} ⭐</span>
                    <span className={`text-[10px] font-semibold ${isActive ? "text-green-700" : "text-gray-400"}`}>
                      {count} ({percentage}%)
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl p-3 border border-gray-200">
            <div className="h-48 flex items-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      padding: "8px 12px",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                    }}
                    formatter={(value, name) => {
                      const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : "0.0";
                      return [`${value} rating${value !== 1 ? "s" : ""} (${percentage}%)`, `${name} star${name !== "1" ? "s" : ""}`];
                    }}
                  />
                  <Pie
                    data={[
                      { name: "5", value: distribution[5] || 0, fill: "#10B981" },
                      { name: "4", value: distribution[4] || 0, fill: "#34D399" },
                      { name: "3", value: distribution[3] || 0, fill: "#FBBF24" },
                      { name: "2", value: distribution[2] || 0, fill: "#FB923C" },
                      { name: "1", value: distribution[1] || 0, fill: "#F87171" },
                    ]}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={70}
                    innerRadius={35}
                    paddingAngle={2}
                    label={({ percent }) => {
                      if (percent < 0.05) return null; // Don't show labels for very small segments
                      return `${(percent * 100).toFixed(0)}%`;
                    }}
                    labelLine={false}
                  >
                    {[
                      { fill: "#10B981" }, // 5 stars - emerald green
                      { fill: "#34D399" }, // 4 stars - light emerald
                      { fill: "#FBBF24" }, // 3 stars - amber
                      { fill: "#FB923C" }, // 2 stars - orange
                      { fill: "#F87171" }, // 1 star - red
                    ].map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.fill}
                        stroke="white"
                        strokeWidth={2}
                        style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))" }}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            {/* Custom Legend */}
            <div className="grid grid-cols-5 gap-1.5 mt-3 pt-3 border-t border-gray-200">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = distribution[star] || 0;
                const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : "0.0";
                const colors = {
                  5: "#10B981",
                  4: "#34D399",
                  3: "#FBBF24",
                  2: "#FB923C",
                  1: "#F87171",
                };
                return (
                  <div
                    key={star}
                    className="flex flex-col items-center p-1.5 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-0.5 mb-0.5">
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: colors[star] }}
                      />
                      <span className="text-[10px] font-medium text-gray-700">{star}⭐</span>
                    </div>
                    <span className="text-[10px] font-semibold text-gray-900">{count}</span>
                    <span className="text-[9px] text-gray-500">{percentage}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
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

function LowStockPanel({ products, loading }) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900">
            Low Stock Alerts
          </h3>
          <p className="text-xs text-gray-500">
            First {products?.length || 0} products with dailyLimit ≤ 5.
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

function ReturnedOrdersChart({ data, loading }) {
  if (loading) {
    return (
      <div className="h-64 bg-gray-100 rounded-xl animate-pulse" />
    );
  }

  if (!data || !data.length || data.every((d) => d.total === 0)) {
    return (
      <div className="h-64 flex items-center justify-center text-xs text-gray-400">
        <div className="text-center">
          <p className="mb-2">No returned orders in this period.</p>
          <p className="text-[0.65rem]">Return requests will appear here once customers submit them.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
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
          />
          <Tooltip
            cursor={{ fill: "rgba(239, 68, 68, 0.04)" }}
            formatter={(value, name) => {
              if (name === "pending") return [value, "Pending Approval"];
              if (name === "approved") return [value, "Approved Returns"];
              return [value, "Total Returns"];
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
            iconSize={10}
            formatter={(value) => {
              if (value === "pending") return "Pending Approval";
              if (value === "approved") return "Approved Returns";
              return "Total";
            }}
          />
          <Bar
            dataKey="total"
            fill="#EF4444"
            radius={[10, 10, 0, 0]}
            name="total"
          />
          <Bar
            dataKey="pending"
            fill="#F97316"
            radius={[10, 10, 0, 0]}
            name="pending"
          />
          <Bar
            dataKey="approved"
            fill="#6B7280"
            radius={[10, 10, 0, 0]}
            name="approved"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default ReportsPage;

