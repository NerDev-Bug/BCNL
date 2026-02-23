// src/components/admin/discounts.jsx
import { useEffect, useMemo, useState } from "react";
import { collection, doc, getDocs, updateDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { toast } from "react-toastify";

import DataTable from "../common/DataTable";
import Search from "../common/Search";
import Pagination from "../common/Pagination";
import ConfirmationModal from "../common/ConfirmationModal";

// ─── Tabs ────────────────────────────────────────────────────────────────────
const TABS = [
  { key: "discounts", label: "Discounts" },
  { key: "promos", label: "Promos (B1T1)" },
];

function DiscountsPage() {
  const [activeTab, setActiveTab] = useState("discounts");

  // ── shared product list ──
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // ── discounts tab state ──
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [discountInput, setDiscountInput] = useState("");
  const [updating, setUpdating] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [editingRewardPoints, setEditingRewardPoints] = useState(null);
  const [rewardPointsInput, setRewardPointsInput] = useState("");

  // ── promos tab state ──
  const [promoSearch, setPromoSearch] = useState("");
  const [promoSelectedIds, setPromoSelectedIds] = useState(new Set());
  const [promoType, setPromoType] = useState("buy1take1"); // "buy1take1" | "xForY"
  const [b1t1PromoPrice, setB1t1PromoPrice] = useState(""); // optional pair price for B1T1
  const [xForYQty, setXForYQty] = useState("3");
  const [xForYPrice, setXForYPrice] = useState("");
  const [promoPage, setPromoPage] = useState(1);
  const [promoUpdating, setPromoUpdating] = useState(false);

  // ── shared confirmation modal ──
  const [confirmationModal, setConfirmationModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: null,
    type: "confirm",
    confirmButtonColor: "bg-[#7B2220]",
  });

  const closeConfirmationModal = () =>
    setConfirmationModal((prev) => ({ ...prev, isOpen: false }));

  // ── fetch all products once ──
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const snap = await getDocs(collection(db, "products"));
        setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setCurrentPage(1);
      } catch (err) {
        console.error("Failed to load products:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // ════════════════════════════════════════════════════════════
  //  DISCOUNTS TAB
  // ════════════════════════════════════════════════════════════
  const formatDiscountLabel = (discount) => {
    if (!discount) return "—";
    if (discount.type === "percent") return `${discount.value}%`;
    if (discount.type === "fixed") return `€${discount.value}`;
    if (discount.type === "buy1take1") {
      if (discount.promoPrice > 0) return `B1T1 · €${Number(discount.promoPrice).toFixed(2)}`;
      return "Buy 1 Take 1";
    }
    if (discount.type === "xForY")
      return `${discount.buyQty} for €${Number(discount.forPrice).toFixed(2)}`;
    return "—";
  };

  const computeFinalPrice = (price, discount) => {
    const base = Number(price || 0);
    if (!discount) return base;
    if (discount.type === "percent")
      return base - (base * Number(discount.value || 0)) / 100;
    if (discount.type === "fixed")
      return Math.max(0, base - Number(discount.value || 0));
    if (discount.type === "buy1take1") {
      if (discount.promoPrice > 0) return Number(discount.promoPrice);
      return base;
    }
    if (discount.type === "xForY")
      return Number(discount.forPrice || base * discount.buyQty) / Number(discount.buyQty || 1);
    return base;
  };

  const parseDiscount = (value) => {
    if (!value) return null;
    const v = value.trim().replace(",", ".");
    const fixedMatch = v.match(/^[€]?(\d+(\.\d+)?)[€]?(?:eur)?$/i);
    if (
      fixedMatch &&
      (v.startsWith("€") ||
        v.toLowerCase().endsWith("€") ||
        v.toLowerCase().endsWith("eur"))
    ) {
      const amount = Number(fixedMatch[1]);
      if (amount <= 0) return null;
      return { type: "fixed", value: amount };
    }
    const percentMatch = v.match(/^(\d+(\.\d+)?)%?$/);
    if (percentMatch) {
      const percent = Number(percentMatch[1]);
      if (percent <= 0 || percent >= 100) return null;
      return { type: "percent", value: percent };
    }
    return null;
  };

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

  const toggleSelectOne = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

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

  const confirmApplyDiscount = () => {
    const parsed = parseDiscount(discountInput);
    if (!parsed) {
      setConfirmationModal({
        isOpen: true,
        title: "Validation Error",
        message:
          "Invalid discount. Use e.g. 10 or 10% for percentage, or €5 / 5€ / 5eur for a fixed amount off.",
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

    // Warn if any selected product already has a B1T1 or xForY promo
    const promoConflicts = products.filter(
      (p) =>
        selectedIds.has(p.id) &&
        (p.productDiscount?.type === "buy1take1" ||
          p.productDiscount?.type === "xForY")
    );
    if (promoConflicts.length > 0) {
      const names = promoConflicts.map((p) => p.name).join(", ");
      setConfirmationModal({
        isOpen: true,
        title: "⚠️ Promo Conflict",
        message: `The following product(s) already have a B1T1 or X-for-Y promo: "${names}". Applying a discount will remove their existing promo. Continue?`,
        onConfirm: () => {
          closeConfirmationModal();
          handleApplyDiscount(parsed);
        },
        type: "confirm",
        confirmButtonColor: "bg-amber-600",
      });
      return;
    }

    const discountText =
      parsed.type === "percent" ? `${parsed.value}%` : `€${parsed.value}`;
    setConfirmationModal({
      isOpen: true,
      title: "Apply Discount",
      message: `Apply ${discountText} discount to ${selectedIds.size} product(s)?`,
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
      const discountText =
        parsed.type === "percent" ? `${parsed.value}%` : `€${parsed.value}`;
      await Promise.all(
        ids.map((id) =>
          updateDoc(doc(db, "products", id), { productDiscount: parsed })
        )
      );
      setProducts((prev) =>
        prev.map((p) =>
          selectedIds.has(p.id) ? { ...p, productDiscount: parsed } : p
        )
      );
      setDiscountInput("");
      clearSelection();
      toast.success(
        `Applied ${discountText} discount to ${ids.length} product(s)!`
      );
    } catch (err) {
      console.error(err);
      toast.error("Failed to apply discount.");
    } finally {
      setUpdating(false);
    }
  };

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
      message: `Remove discounts from ${selectedIds.size} product(s)?`,
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
      await Promise.all(
        ids.map((id) =>
          updateDoc(doc(db, "products", id), { productDiscount: null })
        )
      );
      setProducts((prev) =>
        prev.map((p) =>
          selectedIds.has(p.id) ? { ...p, productDiscount: null } : p
        )
      );
      clearSelection();
      toast.success(`Removed discounts from ${ids.length} product(s)!`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to clear discount.");
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
    const currentPoints =
      products.find((p) => p.id === productId)?.rewardPoints || 0;
    if (pointsValue === currentPoints) {
      setEditingRewardPoints(null);
      setRewardPointsInput("");
      return;
    }
    setConfirmationModal({
      isOpen: true,
      title: "Update Reward Points",
      message: `Update reward points for "${productName}" from ${currentPoints} to ${pointsValue}?`,
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
      toast.success(`Reward points updated to ${pointsValue}`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to update reward points.");
    } finally {
      setUpdating(false);
    }
  };

  const discountColumns = [
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
          checked={selectedIds.has(row.id)}
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
            <div className="text-sm font-semibold text-gray-900">{row.name}</div>
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
      header: "Discount / Promo",
      render: (row) => {
        const label = formatDiscountLabel(row.productDiscount);
        if (label === "—") return <span className="text-gray-400">—</span>;
        return (
          <span className="inline-block bg-red-100 text-red-700 text-xs font-semibold px-2 py-0.5 rounded-full">
            {label}
          </span>
        );
      },
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
            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              <input
                type="number"
                min="0"
                step="1"
                value={rewardPointsInput}
                onChange={(e) => setRewardPointsInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") confirmSaveRewardPoints(row.id, row.name);
                  else if (e.key === "Escape") {
                    setEditingRewardPoints(null);
                    setRewardPointsInput("");
                  }
                }}
                className="w-24 border-2 border-[#7B2220] rounded-lg px-3 py-1.5 text-sm font-medium focus:ring-2 focus:ring-[#7B2220]/30 outline-none"
                autoFocus
              />
              <button
                onClick={(e) => { e.stopPropagation(); confirmSaveRewardPoints(row.id, row.name); }}
                disabled={updating}
                className="flex items-center justify-center w-8 h-8 rounded-lg bg-green-500 hover:bg-green-600 text-white disabled:opacity-50"
                title="Save"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setEditingRewardPoints(null); setRewardPointsInput(""); }}
                disabled={updating}
                className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-500 hover:bg-red-600 text-white disabled:opacity-50"
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
            <span className="text-sm font-semibold text-gray-900 px-2 py-1 rounded-md bg-gray-50 group-hover:bg-gray-100">
              {currentPoints}
            </span>
            <span className="flex items-center justify-center w-6 h-6 rounded-md bg-[#7B2220]/10 text-[#7B2220] group-hover:bg-[#7B2220]/20">
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
    const withDiscount = products.filter((p) => p.productDiscount);
    if (!withDiscount.length) return 0;
    const totalBase = withDiscount.reduce((s, p) => s + Number(p.price || 0), 0);
    const totalFinal = withDiscount.reduce(
      (s, p) => s + computeFinalPrice(p.price, p.productDiscount),
      0
    );
    const saved = totalBase - totalFinal;
    return totalBase ? (saved / totalBase) * 100 : 0;
  }, [products]);

  // ════════════════════════════════════════════════════════════
  //  PROMOS TAB
  // ════════════════════════════════════════════════════════════
  const filteredPromoProducts = useMemo(() => {
    const term = promoSearch.trim().toLowerCase();
    if (!term) return products;
    return products.filter(
      (p) =>
        (p.name || "").toLowerCase().includes(term) ||
        (p.category || "").toLowerCase().includes(term)
    );
  }, [products, promoSearch]);

  useEffect(() => {
    setPromoPage(1);
  }, [promoSearch]);

  const promoTotalPages = Math.ceil(filteredPromoProducts.length / pageSize) || 1;
  const paginatedPromoProducts = filteredPromoProducts.slice(
    (promoPage - 1) * pageSize,
    promoPage * pageSize
  );

  const togglePromoOne = (id) => {
    setPromoSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const togglePromoAllPage = () => {
    setPromoSelectedIds((prev) => {
      const next = new Set(prev);
      const allSelected =
        paginatedPromoProducts.length > 0 &&
        paginatedPromoProducts.every((p) => next.has(p.id));
      if (allSelected) {
        paginatedPromoProducts.forEach((p) => next.delete(p.id));
      } else {
        paginatedPromoProducts.forEach((p) => next.add(p.id));
      }
      return next;
    });
  };

  const confirmApplyPromo = () => {
    if (!promoSelectedIds.size) {
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

    let promoObj;
    let promoText;

    if (promoType === "buy1take1") {
      const parsedPromoPrice = b1t1PromoPrice ? parseFloat(b1t1PromoPrice) : null;
      promoObj = {
        type: "buy1take1",
        ...(parsedPromoPrice > 0 ? { promoPrice: parsedPromoPrice } : {}),
      };
      promoText = parsedPromoPrice > 0
        ? `Buy 1 Take 1 · €${parsedPromoPrice.toFixed(2)}/pair`
        : "Buy 1 Take 1";
    } else {
      const qty = parseInt(xForYQty, 10);
      const price = parseFloat(xForYPrice);
      if (!qty || qty < 2 || isNaN(price) || price <= 0) {
        setConfirmationModal({
          isOpen: true,
          title: "Validation Error",
          message: "Enter a valid quantity (≥2) and price (>0) for the X-for-Y promo.",
          onConfirm: closeConfirmationModal,
          type: "alert",
          confirmButtonColor: "bg-[#7B2220]",
        });
        return;
      }
      promoObj = { type: "xForY", buyQty: qty, forPrice: price };
      promoText = `${qty} for €${price.toFixed(2)}`;
    }

    // Warn if any selected product already has a percent/fixed discount
    const discountConflicts = products.filter(
      (p) =>
        promoSelectedIds.has(p.id) &&
        (p.productDiscount?.type === "percent" ||
          p.productDiscount?.type === "fixed")
    );
    if (discountConflicts.length > 0) {
      const names = discountConflicts.map((p) => p.name).join(", ");
      setConfirmationModal({
        isOpen: true,
        title: "⚠️ Discount Conflict",
        message: `The following product(s) already have a discount: "${names}". Applying this promo will remove their existing discount. Continue?`,
        onConfirm: () => {
          closeConfirmationModal();
          handleApplyPromo(promoObj, promoText);
        },
        type: "confirm",
        confirmButtonColor: "bg-amber-600",
      });
      return;
    }

    setConfirmationModal({
      isOpen: true,
      title: "Apply Promo",
      message: `Apply "${promoText}" promo to ${promoSelectedIds.size} product(s)?`,
      onConfirm: () => {
        closeConfirmationModal();
        handleApplyPromo(promoObj, promoText);
      },
      type: "confirm",
      confirmButtonColor: "bg-[#7B2220]",
    });
  };

  const handleApplyPromo = async (promoObj, promoText) => {
    setPromoUpdating(true);
    try {
      const ids = Array.from(promoSelectedIds);
      await Promise.all(
        ids.map((id) =>
          updateDoc(doc(db, "products", id), { productDiscount: promoObj })
        )
      );
      setProducts((prev) =>
        prev.map((p) =>
          promoSelectedIds.has(p.id)
            ? { ...p, productDiscount: promoObj }
            : p
        )
      );
      setPromoSelectedIds(new Set());
      toast.success(`Applied "${promoText}" to ${ids.length} product(s)!`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to apply promo.");
    } finally {
      setPromoUpdating(false);
    }
  };

  const confirmClearPromo = () => {
    if (!promoSelectedIds.size) {
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
      title: "Clear Promo",
      message: `Remove promo from ${promoSelectedIds.size} product(s)?`,
      onConfirm: () => {
        closeConfirmationModal();
        handleClearPromo();
      },
      type: "confirm",
      confirmButtonColor: "bg-red-600",
    });
  };

  const handleClearPromo = async () => {
    setPromoUpdating(true);
    try {
      const ids = Array.from(promoSelectedIds);
      await Promise.all(
        ids.map((id) =>
          updateDoc(doc(db, "products", id), { productDiscount: null })
        )
      );
      setProducts((prev) =>
        prev.map((p) =>
          promoSelectedIds.has(p.id) ? { ...p, productDiscount: null } : p
        )
      );
      setPromoSelectedIds(new Set());
      toast.success(`Promo removed from ${ids.length} product(s)!`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to clear promo.");
    } finally {
      setPromoUpdating(false);
    }
  };

  const promoColumns = [
    {
      key: "select",
      header: (
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-gray-300 text-[#502455] focus:ring-[#502455]"
          checked={
            paginatedPromoProducts.length > 0 &&
            paginatedPromoProducts.every((p) => promoSelectedIds.has(p.id))
          }
          onChange={togglePromoAllPage}
        />
      ),
      render: (row) => (
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-gray-300 text-[#502455] focus:ring-[#502455]"
          checked={promoSelectedIds.has(row.id)}
          onChange={(e) => {
            e.stopPropagation();
            togglePromoOne(row.id);
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
            <img src={row.image} alt={row.name} className="w-10 h-10 rounded-lg object-cover border border-gray-200" />
          )}
          <div>
            <div className="text-sm font-semibold text-gray-900">{row.name}</div>
            <div className="text-[0.7rem] text-gray-500">{row.category || "Uncategorized"}</div>
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
      key: "currentPromo",
      header: "Current Promo",
      render: (row) => {
        const d = row.productDiscount;
        if (!d) return <span className="text-gray-400 text-xs">None</span>;
        const isPromo = d.type === "buy1take1" || d.type === "xForY";
        const isDiscount = d.type === "percent" || d.type === "fixed";
        return (
          <span
            className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${
              isPromo
                ? "bg-purple-100 text-purple-700"
                : "bg-amber-100 text-amber-700"
            }`}
          >
            {isDiscount
              ? d.type === "percent"
                ? `${d.value}% off`
                : `€${d.value} off`
              : formatDiscountLabel(d)}
          </span>
        );
      },
    },
  ];

  // ════════════════════════════════════════════════════════════
  //  RENDER
  // ════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen min-w-0 bg-gradient-to-br from-gray-50 to-gray-100 p-3 sm:p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto w-full min-w-0">

        {/* HEADER */}
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-1">
              Discounts / Promotions
            </h1>
            <p className="text-xs sm:text-sm text-gray-500">
              Manage product discounts and Buy 1 Take 1 promotions.
            </p>
          </div>
          <div className="flex flex-col items-start sm:items-end flex-shrink-0">
            <span className="text-xs uppercase tracking-wide text-gray-500">Avg. Discount</span>
            <span className="text-2xl font-bold text-[#502455]">
              {products.length ? `${avgDiscount.toFixed(1)}%` : "0%"}
            </span>
            <span className="text-xs text-gray-400">
              {products.filter((p) => p.productDiscount).length} discounted products
            </span>
          </div>
        </div>

        {/* TABS */}
        <div className="flex gap-1 border-b border-gray-200 mb-6">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all rounded-t-lg whitespace-nowrap
                ${activeTab === tab.key
                  ? "border-[#7B2220] text-[#7B2220] bg-[#7B2220]/5"
                  : "border-transparent text-gray-500 hover:text-[#7B2220] hover:bg-gray-50"
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── DISCOUNTS TAB ── */}
        {activeTab === "discounts" && (
          <>
            {/* Controls */}
            <div className="mb-4 bg-white rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-100">
              <div className="flex flex-col sm:flex-row sm:flex-wrap gap-4 items-stretch sm:items-end">
                <div className="w-full sm:flex-1">
                  <Search
                    value={search}
                    onChange={setSearch}
                    placeholder="Search by product name or category"
                  />
                </div>
                <div className="flex flex-col gap-2 w-full sm:w-auto">
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
                    className="border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-[#7B2220] outline-none w-full sm:w-auto"
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

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <DataTable columns={discountColumns} data={paginatedProducts} loading={loading} />
            </div>
            {totalPages > 1 && (
              <div className="mt-6 flex justify-center">
                <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
              </div>
            )}
          </>
        )}

        {/* ── PROMOS TAB ── */}
        {activeTab === "promos" && (
          <>
            {/* Promo builder */}
            <div className="mb-4 bg-white rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-100">
              <h2 className="text-sm font-bold text-gray-700 mb-4">Configure Promo</h2>

              {/* Promo type selector */}
              <div className="flex gap-3 mb-5">
                <button
                  type="button"
                  onClick={() => setPromoType("buy1take1")}
                  className={`flex-1 py-3 rounded-xl border-2 text-sm font-semibold transition-all
                    ${promoType === "buy1take1"
                      ? "border-purple-500 bg-purple-50 text-purple-700"
                      : "border-gray-200 text-gray-500 hover:border-purple-300"
                    }`}
                >
                  🎁 Buy 1 Take 1
                  <div className="text-[0.65rem] font-normal text-gray-400 mt-0.5">
                    Customer pays for 1, gets 2
                  </div>
                </button>
                {/* <button
                  type="button"
                  onClick={() => setPromoType("xForY")}
                  className={`flex-1 py-3 rounded-xl border-2 text-sm font-semibold transition-all
                    ${promoType === "xForY"
                      ? "border-purple-500 bg-purple-50 text-purple-700"
                      : "border-gray-200 text-gray-500 hover:border-purple-300"
                    }`}
                >
                  🏷️ X for Y Price
                  <div className="text-[0.65rem] font-normal text-gray-400 mt-0.5">
                    e.g. 3 pieces for €10
                  </div>
                </button> */}
              </div>

              {/* B1T1 optional pair price */}
              {promoType === "buy1take1" && (
                <div className="flex flex-col sm:flex-row gap-4 mb-5 p-4 bg-purple-50 border border-purple-100 rounded-xl">
                  <div className="flex flex-col gap-1 flex-1">
                    <label className="text-xs font-semibold text-gray-700">
                      Promo Pair Price (€) <span className="text-gray-400 font-normal">— optional</span>
                    </label>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={b1t1PromoPrice}
                      onChange={(e) => setB1t1PromoPrice(e.target.value)}
                      className="border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-purple-500 outline-none"
                      placeholder="e.g. 7.00 (total price for 2 items)"
                    />
                    <p className="text-[0.7rem] text-gray-400">
                      Kung walang halaga: libre lang ang 2nd item (normal B1T1).
                      Kung may halaga: gagamitin ito bilang total price para sa 2 items.
                    </p>
                  </div>
                  {b1t1PromoPrice && Number(b1t1PromoPrice) > 0 && (
                    <div className="flex items-center">
                      <span className="text-xs bg-white border border-purple-200 rounded-lg px-3 py-2 text-purple-700 font-medium whitespace-nowrap">
                        2 items = €{Number(b1t1PromoPrice).toFixed(2)}<br />
                        <span className="text-gray-400 font-normal">
                          (€{(Number(b1t1PromoPrice) / 2).toFixed(2)} each)
                        </span>
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* X-for-Y inputs */}
              {promoType === "xForY" && (
                <div className="flex flex-col sm:flex-row gap-4 mb-5">
                  <div className="flex flex-col gap-1 flex-1">
                    <label className="text-xs font-semibold text-gray-600">Quantity (X)</label>
                    <input
                      type="number"
                      min="2"
                      step="1"
                      value={xForYQty}
                      onChange={(e) => setXForYQty(e.target.value)}
                      className="border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-[#7B2220] outline-none"
                      placeholder="e.g. 3"
                    />
                  </div>
                  <div className="flex flex-col gap-1 flex-1">
                    <label className="text-xs font-semibold text-gray-600">Total Price (€)</label>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={xForYPrice}
                      onChange={(e) => setXForYPrice(e.target.value)}
                      className="border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-[#7B2220] outline-none"
                      placeholder="e.g. 10.00"
                    />
                  </div>
                  {xForYQty && xForYPrice && (
                    <div className="flex items-end pb-2">
                      <span className="text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 whitespace-nowrap">
                        {xForYQty} pcs for €{Number(xForYPrice).toFixed(2)}
                        {" "}(€{(Number(xForYPrice) / Number(xForYQty)).toFixed(2)} each)
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Search + action buttons */}
              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
                <div className="flex-1">
                  <Search
                    value={promoSearch}
                    onChange={setPromoSearch}
                    placeholder="Search products..."
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={confirmApplyPromo}
                    disabled={promoUpdating || !promoSelectedIds.size}
                    className="px-4 py-2 rounded-xl bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {promoUpdating ? "Applying..." : `Apply to ${promoSelectedIds.size || 0} Selected`}
                  </button>
                  <button
                    type="button"
                    onClick={confirmClearPromo}
                    disabled={promoUpdating || !promoSelectedIds.size}
                    className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 text-sm font-semibold hover:bg-gray-200 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    Clear Promo
                  </button>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <DataTable columns={promoColumns} data={paginatedPromoProducts} loading={loading} />
            </div>
            {promoTotalPages > 1 && (
              <div className="mt-6 flex justify-center">
                <Pagination currentPage={promoPage} totalPages={promoTotalPages} onPageChange={setPromoPage} />
              </div>
            )}
          </>
        )}

        {/* Shared Confirmation Modal */}
        <ConfirmationModal
          isOpen={confirmationModal.isOpen}
          onClose={closeConfirmationModal}
          onConfirm={() => confirmationModal.onConfirm?.()}
          title={confirmationModal.title}
          message={confirmationModal.message}
          type={confirmationModal.type}
          confirmButtonColor={confirmationModal.confirmButtonColor}
          loading={updating || promoUpdating}
        />
      </div>
    </div>
  );
}

export default DiscountsPage;
