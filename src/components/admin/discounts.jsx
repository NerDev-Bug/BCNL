// src/components/admin/discounts.jsx
import { useEffect, useMemo, useState } from "react";
import { collection, doc, getDocs, updateDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { toast } from "react-toastify";

import DataTable from "../common/DataTable";
import Search from "../common/Search";
import Pagination from "../common/Pagination";
import ConfirmationModal from "../common/ConfirmationModal";

function DiscountsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [discountInput, setDiscountInput] = useState("");
  const [updating, setUpdating] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [editingRewardPoints, setEditingRewardPoints] = useState(null); // { productId: value }
  const [rewardPointsInput, setRewardPointsInput] = useState("");

  // ✅ Confirmation modal state
  const [confirmationModal, setConfirmationModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: null,
    type: "confirm",
    confirmButtonColor: "bg-[#7B2220]",
  });

  const closeConfirmationModal = () => {
    setConfirmationModal((prev) => ({ ...prev, isOpen: false }));
  };

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

    const v = value.trim().replace(",", ".");

    // Fixed amount: €5, 5€, 5eur, 5EUR
    const fixedMatch = v.match(/^[€]?(\d+(\.\d+)?)[€]?(?:eur)?$/i);
    if (fixedMatch && (v.startsWith("€") || v.toLowerCase().endsWith("€") || v.toLowerCase().endsWith("eur"))) {
      const amount = Number(fixedMatch[1]);
      if (amount <= 0) return null;
      return { type: "fixed", value: amount };
    }

    // Percentage: 10%, 10
    const percentMatch = v.match(/^(\d+(\.\d+)?)%?$/);
    if (percentMatch) {
      const percent = Number(percentMatch[1]);
      if (percent <= 0 || percent >= 100) return null;
      return { type: "percent", value: percent };
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

  // ✅ Confirmation wrapper for Apply Discount
  const confirmApplyDiscount = () => {
    const parsed = parseDiscount(discountInput);
    if (!parsed) {
      setConfirmationModal({
        isOpen: true,
        title: "Validation Error",
        message: "Invalid discount. Use e.g. 10 or 10% for percentage, or €5 / 5€ / 5eur for a fixed amount off.",
        onConfirm: closeConfirmationModal,
        type: "alert",
        confirmButtonColor: "bg-[#7B2220]",
      });
      return;
    }

    if (!selectedIds.size) {
      setConfirmationModal({
        isOpen: true,
        title: "No Selection",
        message: "Select at least one product.",
        onConfirm: closeConfirmationModal,
        type: "alert",
        confirmButtonColor: "bg-[#7B2220]",
      });
      return;
    }

    const discountText = parsed.type === "percent" 
      ? `${parsed.value}%` 
      : `€${parsed.value}`;

    setConfirmationModal({
      isOpen: true,
      title: "Apply Discount",
      message: `Are you sure you want to apply ${discountText} discount to ${selectedIds.size} selected product(s)?`,
      onConfirm: () => {
        closeConfirmationModal();
        handleApplyDiscount(parsed);
      },
      type: "confirm",
      confirmButtonColor: "bg-[#7B2220]",
    });
  };

  const handleApplyDiscount = async (parsed) => {
    setUpdating(true);
    try {
      const ids = Array.from(selectedIds);
      const count = ids.length;
      const discountText = parsed.type === "percent" 
        ? `${parsed.value}%` 
        : `€${parsed.value}`;

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

      // ✅ Clear input and selection after success
      setDiscountInput("");
      clearSelection();

      // ✅ Show success toast
      toast.success(
        `Successfully applied ${discountText} discount to ${count} product(s)!`,
        {
          position: "top-right",
          autoClose: 3000,
        }
      );
    } catch (err) {
      console.error("Failed to apply discount:", err);
      setConfirmationModal({
        isOpen: true,
        title: "Error",
        message: "Failed to apply discount. Check console.",
        onConfirm: closeConfirmationModal,
        type: "alert",
        confirmButtonColor: "bg-red-600",
      });
    } finally {
      setUpdating(false);
    }
  };

  // ✅ Confirmation wrapper for Clear Discount
  const confirmClearDiscount = () => {
    if (!selectedIds.size) {
      setConfirmationModal({
        isOpen: true,
        title: "No Selection",
        message: "Select at least one product.",
        onConfirm: closeConfirmationModal,
        type: "alert",
        confirmButtonColor: "bg-[#7B2220]",
      });
      return;
    }

    setConfirmationModal({
      isOpen: true,
      title: "Clear Discount",
      message: `Are you sure you want to remove discounts from ${selectedIds.size} selected product(s)? This action cannot be undone.`,
      onConfirm: () => {
        handleClearDiscount();
        closeConfirmationModal();
      },
      type: "confirm",
      confirmButtonColor: "bg-red-600",
    });
  };

  const handleClearDiscount = async () => {
    setUpdating(true);
    try {
      const ids = Array.from(selectedIds);
      const count = ids.length;

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

      // ✅ Clear selection after success
      clearSelection();

      // ✅ Show success toast
      toast.success(
        `Successfully removed discounts from ${count} product(s)!`,
        {
          position: "top-right",
          autoClose: 3000,
        }
      );
    } catch (err) {
      console.error("Failed to clear discount:", err);
      setConfirmationModal({
        isOpen: true,
        title: "Error",
        message: "Failed to clear discount. Check console.",
        onConfirm: closeConfirmationModal,
        type: "alert",
        confirmButtonColor: "bg-red-600",
      });
    } finally {
      setUpdating(false);
    }
  };

  const confirmSaveRewardPoints = (productId, productName) => {
    const pointsValue = parseInt(rewardPointsInput, 10);
    
    if (isNaN(pointsValue) || pointsValue < 0) {
      setConfirmationModal({
        isOpen: true,
        title: "Invalid Input",
        message: "Please enter a valid number (0 or greater).",
        onConfirm: closeConfirmationModal,
        type: "alert",
        confirmButtonColor: "bg-[#7B2220]",
      });
      return;
    }

    const currentPoints = products.find(p => p.id === productId)?.rewardPoints || 0;
    const isChanging = pointsValue !== currentPoints;

    if (!isChanging) {
      // No change, just close editing
      setEditingRewardPoints(null);
      setRewardPointsInput("");
      return;
    }

    setConfirmationModal({
      isOpen: true,
      title: "Update Reward Points",
      message: `Are you sure you want to update reward points for "${productName}" from ${currentPoints} to ${pointsValue}?`,
      onConfirm: () => {
        closeConfirmationModal();
        handleSaveRewardPoints(productId);
      },
      type: "confirm",
      confirmButtonColor: "bg-[#7B2220]",
    });
  };

  const handleSaveRewardPoints = async (productId) => {
    const pointsValue = parseInt(rewardPointsInput, 10);

    setUpdating(true);
    try {
      await updateDoc(doc(db, "products", productId), {
        rewardPoints: pointsValue,
      });

      setProducts((prev) =>
        prev.map((p) =>
          p.id === productId ? { ...p, rewardPoints: pointsValue } : p
        )
      );

      setEditingRewardPoints(null);
      setRewardPointsInput("");

      toast.success(`Reward points updated to ${pointsValue}`, {
        position: "top-right",
        autoClose: 2000,
      });
    } catch (err) {
      console.error("Failed to update reward points:", err);
      setConfirmationModal({
        isOpen: true,
        title: "Error",
        message: "Failed to update reward points. Please try again.",
        onConfirm: closeConfirmationModal,
        type: "alert",
        confirmButtonColor: "bg-red-600",
      });
    } finally {
      setUpdating(false);
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
    {
      key: "rewardPoints",
      header: "Reward Points",
      render: (row) => {
        const isEditing = editingRewardPoints === row.id;
        const currentPoints = row.rewardPoints || 0;

        if (isEditing) {
          return (
            <div 
              className="flex items-center gap-2"
              onClick={(e) => e.stopPropagation()}
            >
              <input
                type="number"
                min="0"
                step="1"
                value={rewardPointsInput}
                onChange={(e) => setRewardPointsInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    confirmSaveRewardPoints(row.id, row.name);
                  } else if (e.key === "Escape") {
                    setEditingRewardPoints(null);
                    setRewardPointsInput("");
                  }
                }}
                className="w-24 border-2 border-[#7B2220] rounded-lg px-3 py-1.5 text-sm font-medium focus:ring-2 focus:ring-[#7B2220]/30 focus:border-[#7B2220] outline-none transition-all"
                autoFocus
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  confirmSaveRewardPoints(row.id, row.name);
                }}
                disabled={updating}
                className="flex items-center justify-center w-8 h-8 rounded-lg bg-green-500 hover:bg-green-600 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Save"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingRewardPoints(null);
                  setRewardPointsInput("");
                }}
                disabled={updating}
                className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-500 hover:bg-red-600 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Cancel"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          );
        }

        return (
          <div
            className="flex items-center gap-2 cursor-pointer group"
            onClick={(e) => {
              e.stopPropagation();
              setEditingRewardPoints(row.id);
              setRewardPointsInput(String(currentPoints));
            }}
          >
            <span className="text-sm font-semibold text-gray-900 px-2 py-1 rounded-md bg-gray-50 group-hover:bg-gray-100 transition-colors">
              {currentPoints}
            </span>
            <span className="flex items-center justify-center w-6 h-6 rounded-md bg-[#7B2220]/10 text-[#7B2220] group-hover:bg-[#7B2220]/20 transition-all duration-200">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </span>
          </div>
        );
      },
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
    <div className="min-h-screen min-w-0 bg-gradient-to-br from-gray-50 to-gray-100 p-3 sm:p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto w-full min-w-0">
        {/* HEADER */}
        <div className="mb-4 sm:mb-6 md:mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-1">
              Discounts / Promotions
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 max-w-xl break-words">
              Overview of product-level discounts. Select one or more products,
              set a discount, and apply it in bulk.
            </p>
          </div>

          <div className="flex flex-col items-start sm:items-end flex-shrink-0">
            <span className="text-xs uppercase tracking-wide text-gray-500">
              Avg. Discount Level
            </span>
            <span className="text-xl sm:text-2xl font-bold text-[#502455]">
              {products.length ? `${avgDiscount.toFixed(1)}%` : "0%"}
            </span>
            <span className="text-xs text-gray-400">
              {products.filter(p => p.productDiscount).length} discounted products
            </span>
          </div>
        </div>

        {/* SEARCH + DISCOUNT CONTROLS: stack on mobile */}
        <div className="mb-4 sm:mb-6 bg-white rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-100">
          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-4 items-stretch sm:items-end">
            <div className="w-full min-w-0 sm:flex-1 sm:min-w-[180px]">
              <Search
                value={search}
                onChange={setSearch}
                placeholder="Search by product name or category"
              />
            </div>

            <div className="flex flex-col gap-2 w-full sm:w-auto sm:min-w-[120px]">
              <label className="text-xs font-semibold text-gray-600">
                Discount to apply
              </label>
              <input
                type="number"
                min="1"
                max="99"
                step="0.1"
                value={discountInput}
                onChange={(e) => setDiscountInput(e.target.value)}
                className="border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-[#7B2220] focus:ring-2 focus:ring-[#7B2220]/20 outline-none w-full sm:w-auto min-w-0"
                placeholder="10% or €5"
              />
            </div>

            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={confirmApplyDiscount}
                disabled={updating || !selectedIds.size}
                className="px-4 py-2 rounded-xl bg-[#7B2220] text-white text-sm font-semibold hover:bg-[#8B3230] disabled:opacity-60 disabled:cursor-not-allowed w-full sm:w-auto"
              >
                {updating ? "Applying..." : "Apply to Selected"}
              </button>
              <button
                type="button"
                onClick={confirmClearDiscount}
                disabled={updating || !selectedIds.size}
                className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 text-sm font-semibold hover:bg-gray-200 disabled:opacity-60 disabled:cursor-not-allowed w-full sm:w-auto"
              >
                Clear Discount
              </button>
            </div>
          </div>
        </div>

        {/* TABLE – same scroll-inside pattern as src/components/order */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden min-w-0">
          <div className="w-full min-w-0">
            <DataTable
              columns={columns}
              data={paginatedProducts}
              loading={loading}
            />
          </div>
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

        {/* Confirmation Modal */}
        <ConfirmationModal
          isOpen={confirmationModal.isOpen}
          onClose={closeConfirmationModal}
          onConfirm={() => {
            if (confirmationModal.onConfirm) {
              confirmationModal.onConfirm();
            }
          }}
          title={confirmationModal.title}
          message={confirmationModal.message}
          type={confirmationModal.type}
          confirmButtonColor={confirmationModal.confirmButtonColor}
          loading={updating}
        />
      </div>
    </div>
  );
}

export default DiscountsPage;

