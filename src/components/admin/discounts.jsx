// src/components/admin/discounts.jsx
import { useEffect, useMemo, useState } from "react";
import { collection, doc, getDocs, updateDoc } from "firebase/firestore";
import { db } from "../../firebase";

import DataTable from "../common/DataTable";
import Search from "../common/Search";
import Pagination from "../common/Pagination";

function DiscountsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [discountInput, setDiscountInput] = useState("");
  const [updating, setUpdating] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);

  useEffect(() => {
    const fetchDiscounted = async () => {
      setLoading(true);
      try {
        const snap = await getDocs(collection(db, "products"));
        const list = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));

        setProducts(list);
        setCurrentPage(1);
      } catch (err) {
        console.error("Failed to load discounted products:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDiscounted();
  }, []);

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return products;

    return products.filter(
      (p) =>
        (p.name || "").toLowerCase().includes(term) ||
        (p.category || "").toLowerCase().includes(term)
    );
  }, [products, search]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const totalPages = Math.ceil(filteredProducts.length / pageSize) || 1;
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const formatDiscount = (discount) => {
    if (!discount) return "—";
    if (discount.type === "percent") return `${discount.value}%`;
    if (discount.type === "fixed") return `€${discount.value}`;
    return "—";
  };

  const computeFinalPrice = (price, discount) => {
    const base = Number(price || 0);
    if (!discount) return base;

    if (discount.type === "percent") {
      return base - (base * Number(discount.value || 0)) / 100;
    }
    if (discount.type === "fixed") {
      return Math.max(0, base - Number(discount.value || 0));
    }
    return base;
  };

  const parseDiscount = (value) => {
    if (!value) return null;

    const v = value.trim();

    if (/^\d+(\.\d+)?%$/.test(v)) {
      const percent = Number(v.replace("%", ""));
      if (percent <= 0 || percent >= 100) return null;
      return { type: "percent", value: percent };
    }

    if (/^\d+(\.\d+)?€?$/.test(v)) {
      const amount = Number(v.replace("€", ""));
      if (amount <= 0) return null;
      return { type: "fixed", value: amount };
    }

    return null;
  };

  const toggleSelectOne = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const isSelected = (id) => selectedIds.has(id);

  const toggleSelectAllPage = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      const allSelected =
        paginatedProducts.length > 0 &&
        paginatedProducts.every((p) => next.has(p.id));

      if (allSelected) {
        paginatedProducts.forEach((p) => next.delete(p.id));
      } else {
        paginatedProducts.forEach((p) => next.add(p.id));
      }

      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  const handleApplyDiscount = async () => {
    const parsed = parseDiscount(discountInput);
    if (!parsed) {
      alert("Invalid discount. Use e.g. 10% or 5€");
      return;
    }

    if (!selectedIds.size) {
      alert("Select at least one product.");
      return;
    }

    setUpdating(true);
    try {
      const ids = Array.from(selectedIds);

      await Promise.all(
        ids.map((id) =>
          updateDoc(doc(db, "products", id), {
            productDiscount: parsed,
          })
        )
      );

      setProducts((prev) =>
        prev.map((p) =>
          selectedIds.has(p.id) ? { ...p, productDiscount: parsed } : p
        )
      );
    } catch (err) {
      console.error("Failed to apply discount:", err);
      alert("Failed to apply discount. Check console.");
    } finally {
      setUpdating(false);
    }
  };

  const handleClearDiscount = async () => {
    if (!selectedIds.size) {
      alert("Select at least one product.");
      return;
    }

    setUpdating(true);
    try {
      const ids = Array.from(selectedIds);

      await Promise.all(
        ids.map((id) =>
          updateDoc(doc(db, "products", id), {
            productDiscount: null,
          })
        )
      );

      setProducts((prev) =>
        prev.map((p) =>
          selectedIds.has(p.id) ? { ...p, productDiscount: null } : p
        )
      );
    } catch (err) {
      console.error("Failed to clear discount:", err);
      alert("Failed to clear discount. Check console.");
    } finally {
      setUpdating(false);
      clearSelection();
    }
  };

  const columns = [
    {
      key: "select",
      header: (
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-gray-300 text-[#502455] focus:ring-[#502455]"
          checked={
            paginatedProducts.length > 0 &&
            paginatedProducts.every((p) => selectedIds.has(p.id))
          }
          onChange={toggleSelectAllPage}
        />
      ),
      render: (row) => (
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-gray-300 text-[#502455] focus:ring-[#502455]"
          checked={isSelected(row.id)}
          onChange={(e) => {
            e.stopPropagation();
            toggleSelectOne(row.id);
          }}
        />
      ),
    },
    {
      key: "name",
      header: "Product",
      render: (row) => (
        <div className="flex items-center gap-3">
          {row.image && (
            <img
              src={row.image}
              alt={row.name}
              className="w-10 h-10 rounded-lg object-cover border border-gray-200"
            />
          )}
          <div>
            <div className="text-sm font-semibold text-gray-900">
              {row.name}
            </div>
            <div className="text-[0.7rem] text-gray-500">
              {row.category || "Uncategorized"}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "price",
      header: "Base Price",
      render: (row) => `€${Number(row.price || 0).toFixed(2)}`,
    },
    {
      key: "productDiscount",
      header: "Discount",
      render: (row) => formatDiscount(row.productDiscount),
    },
    {
      key: "finalPrice",
      header: "Final Price",
      render: (row) =>
        `€${computeFinalPrice(row.price, row.productDiscount).toFixed(2)}`,
    },
  ];

  const avgDiscount = useMemo(() => {
    if (!products.length) return 0;

    const withDiscount = products.filter((p) => p.productDiscount);
    if (!withDiscount.length) return 0;

    const totalBase = withDiscount.reduce(
      (sum, p) => sum + Number(p.price || 0),
      0
    );
    const totalFinal = withDiscount.reduce(
      (sum, p) => sum + computeFinalPrice(p.price, p.productDiscount),
      0
    );

    const saved = totalBase - totalFinal;
    return totalBase ? (saved / totalBase) * 100 : 0;
  }, [products]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">
              Discounts / Promotions
            </h1>
            <p className="text-sm text-gray-500 max-w-xl">
              Overview of product-level discounts. Select one or more products,
              set a discount, and apply it in bulk.
            </p>
          </div>

          <div className="flex flex-col items-end">
            <span className="text-xs uppercase tracking-wide text-gray-500">
              Avg. Discount Level
            </span>
            <span className="text-2xl font-bold text-[#502455]">
              {products.length ? `${avgDiscount.toFixed(1)}%` : "0%"}
            </span>
            <span className="text-xs text-gray-400">
              {products.length} discounted products
            </span>
          </div>
        </div>

        {/* SEARCH + DISCOUNT CONTROLS */}
        <div className="mb-6 bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[220px]">
              <Search
                value={search}
                onChange={setSearch}
                placeholder="Search by product name or category"
              />
            </div>

            <div className="flex flex-col gap-2 min-w-[220px]">
              <label className="text-xs font-semibold text-gray-600">
                Discount to apply (e.g. 10% or 5€)
              </label>
              <input
                type="text"
                value={discountInput}
                onChange={(e) => setDiscountInput(e.target.value)}
                className="border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-[#7B2220] focus:ring-2 focus:ring-[#7B2220]/20 outline-none"
                placeholder="10% or 5€"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleApplyDiscount}
                disabled={updating || !selectedIds.size}
                className="px-4 py-2 rounded-xl bg-[#7B2220] text-white text-sm font-semibold hover:bg-[#8B3230] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {updating ? "Applying..." : "Apply to Selected"}
              </button>
              <button
                type="button"
                onClick={handleClearDiscount}
                disabled={updating || !selectedIds.size}
                className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 text-sm font-semibold hover:bg-gray-200 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Clear Discount
              </button>
            </div>
          </div>
        </div>

        {/* TABLE */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <DataTable
            columns={columns}
            data={paginatedProducts}
            loading={loading}
          />
        </div>

        {/* PAGINATION */}
        {totalPages > 1 && (
          <div className="mt-6 flex justify-center">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default DiscountsPage;

