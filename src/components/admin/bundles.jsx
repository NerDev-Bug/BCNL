// src/components/admin/bundles.jsx
import { useEffect, useState, useMemo } from "react";
import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../firebase";
import { toast } from "react-toastify";
import ConfirmationModal from "../common/ConfirmationModal";
import { Package, Plus, Pencil, Trash2, X, Check } from "lucide-react";

const EMPTY_FORM = {
  name: "",
  description: "",
  bundlePrice: "",
  active: true,
  items: [], // [{ productId, productName, productImage, qty }]
};

function BundlesPage() {
  const [bundles, setBundles] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [productSearch, setProductSearch] = useState("");

  // confirmation modal
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: null,
    type: "confirm",
    confirmButtonColor: "bg-red-600",
  });
  const closeConfirm = () => setConfirmModal((p) => ({ ...p, isOpen: false }));

  // ── fetch data ──
  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [bundleSnap, productSnap] = await Promise.all([
          getDocs(collection(db, "bundles")),
          getDocs(collection(db, "products")),
        ]);
        setBundles(bundleSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setProducts(productSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error(err);
        toast.error("Failed to load data.");
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  // ── form helpers ──
  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setProductSearch("");
    setShowForm(true);
  };

  const openEdit = (bundle) => {
    setEditingId(bundle.id);
    setForm({
      name: bundle.name || "",
      description: bundle.description || "",
      bundlePrice: String(bundle.bundlePrice ?? ""),
      active: bundle.active !== false,
      items: bundle.items || [],
    });
    setProductSearch("");
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const addProductToBundle = (product) => {
    setForm((prev) => {
      const exists = prev.items.find((i) => i.productId === product.id);
      if (exists) {
        return {
          ...prev,
          items: prev.items.map((i) =>
            i.productId === product.id ? { ...i, qty: i.qty + 1 } : i
          ),
        };
      }
      return {
        ...prev,
        items: [
          ...prev.items,
          {
            productId: product.id,
            productName: product.name,
            productImage: product.image || null,
            productPrice: Number(product.price || 0),
            qty: 1,
          },
        ],
      };
    });
    setProductSearch("");
  };

  const updateBundleItemQty = (productId, qty) => {
    if (qty < 1) return;
    setForm((prev) => ({
      ...prev,
      items: prev.items.map((i) =>
        i.productId === productId ? { ...i, qty } : i
      ),
    }));
  };

  const removeBundleItem = (productId) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.filter((i) => i.productId !== productId),
    }));
  };

  const totalOriginalPrice = useMemo(
    () => form.items.reduce((s, i) => s + i.productPrice * i.qty, 0),
    [form.items]
  );

  const savings = useMemo(() => {
    const price = parseFloat(form.bundlePrice);
    if (!isNaN(price) && price > 0) return Math.max(0, totalOriginalPrice - price);
    return 0;
  }, [totalOriginalPrice, form.bundlePrice]);

  const handleSave = async () => {
    if (!form.name.trim()) return toast.error("Bundle name is required.");
    if (form.items.length < 2) return toast.error("A bundle needs at least 2 products.");
    const bundlePrice = parseFloat(form.bundlePrice);
    if (isNaN(bundlePrice) || bundlePrice <= 0)
      return toast.error("Enter a valid bundle price.");

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        bundlePrice,
        active: form.active,
        items: form.items,
        updatedAt: serverTimestamp(),
      };

      if (editingId) {
        await updateDoc(doc(db, "bundles", editingId), payload);
        setBundles((prev) =>
          prev.map((b) =>
            b.id === editingId ? { ...b, ...payload, id: editingId } : b
          )
        );
        toast.success("Bundle updated!");
      } else {
        payload.createdAt = serverTimestamp();
        const ref = await addDoc(collection(db, "bundles"), payload);
        setBundles((prev) => [...prev, { id: ref.id, ...payload }]);
        toast.success("Bundle created!");
      }
      closeForm();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save bundle.");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (bundle) => {
    setConfirmModal({
      isOpen: true,
      title: "Delete Bundle",
      message: `Delete "${bundle.name}"? This cannot be undone.`,
      onConfirm: () => {
        closeConfirm();
        handleDelete(bundle.id);
      },
      type: "confirm",
      confirmButtonColor: "bg-red-600",
    });
  };

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, "bundles", id));
      setBundles((prev) => prev.filter((b) => b.id !== id));
      toast.success("Bundle deleted.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete bundle.");
    }
  };

  const toggleActive = async (bundle) => {
    try {
      await updateDoc(doc(db, "bundles", bundle.id), { active: !bundle.active });
      setBundles((prev) =>
        prev.map((b) =>
          b.id === bundle.id ? { ...b, active: !b.active } : b
        )
      );
    } catch {
      toast.error("Failed to update bundle status.");
    }
  };

  // filtered product picker — always show all, filtered by search
  const filteredPickerProducts = useMemo(() => {
    const term = productSearch.trim().toLowerCase();
    if (!term) return products;
    return products.filter(
      (p) =>
        (p.name || "").toLowerCase().includes(term) ||
        (p.category || "").toLowerCase().includes(term)
    );
  }, [products, productSearch]);

  // ── RENDER ──
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-3 sm:p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1 flex items-center gap-2">
              <Package className="w-7 h-7 text-[#7B2220]" />
              Product Bundles
            </h1>
            <p className="text-sm text-gray-500">
              Package multiple products together at a special bundle price.
            </p>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-[#7B2220] text-white rounded-xl text-sm font-semibold hover:bg-[#8B3230] transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Bundle
          </button>
        </div>

        {/* Bundle list */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 animate-pulse">
                <div className="h-5 bg-gray-200 rounded w-2/3 mb-3" />
                <div className="h-4 bg-gray-100 rounded w-full mb-2" />
                <div className="h-4 bg-gray-100 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : bundles.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No bundles yet</p>
            <p className="text-xs text-gray-400 mt-1">
              Click "New Bundle" to create your first product bundle.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {bundles.map((bundle) => {
              const origTotal = (bundle.items || []).reduce(
                (s, i) => s + i.productPrice * i.qty,
                0
              );
              const saving = Math.max(0, origTotal - (bundle.bundlePrice || 0));

              return (
                <div
                  key={bundle.id}
                  className={`bg-white rounded-2xl border shadow-sm p-5 flex flex-col gap-3 transition-all
                    ${bundle.active ? "border-gray-100" : "border-gray-200 opacity-60"}`}
                >
                  {/* Name + status */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 truncate">{bundle.name}</h3>
                      {bundle.description && (
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                          {bundle.description}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => toggleActive(bundle)}
                      className={`flex-shrink-0 px-2 py-0.5 rounded-full text-[0.65rem] font-bold border transition-colors
                        ${bundle.active
                          ? "bg-green-100 text-green-700 border-green-200"
                          : "bg-gray-100 text-gray-500 border-gray-200"
                        }`}
                    >
                      {bundle.active ? "Active" : "Inactive"}
                    </button>
                  </div>

                  {/* Items */}
                  <div className="flex flex-wrap gap-1.5">
                    {(bundle.items || []).map((item) => (
                      <div
                        key={item.productId}
                        className="flex items-center gap-1.5 bg-gray-50 border border-gray-100 rounded-lg px-2 py-1"
                      >
                        {item.productImage && (
                          <img
                            src={item.productImage}
                            alt={item.productName}
                            className="w-5 h-5 rounded object-cover"
                          />
                        )}
                        <span className="text-xs text-gray-700">
                          {item.productName}
                          {item.qty > 1 && (
                            <span className="text-gray-400"> ×{item.qty}</span>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Pricing */}
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-bold text-[#7B2220]">
                      €{Number(bundle.bundlePrice || 0).toFixed(2)}
                    </span>
                    {origTotal > 0 && (
                      <span className="text-xs text-gray-400 line-through">
                        €{origTotal.toFixed(2)}
                      </span>
                    )}
                    {saving > 0 && (
                      <span className="text-xs font-semibold text-green-600">
                        Save €{saving.toFixed(2)}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-1 border-t border-gray-100">
                    <button
                      onClick={() => openEdit(bundle)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 text-xs font-semibold hover:bg-gray-200 transition-colors"
                    >
                      <Pencil className="w-3 h-3" /> Edit
                    </button>
                    <button
                      onClick={() => confirmDelete(bundle)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-semibold hover:bg-red-100 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" /> Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── BUNDLE FORM MODAL ── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">
                {editingId ? "Edit Bundle" : "Create Bundle"}
              </h2>
              <button onClick={closeForm} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal body */}
            <div className="overflow-y-auto flex-1 px-6 py-4 space-y-5">

              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Bundle Name *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-[#7B2220] outline-none"
                  placeholder="e.g. Weekend Treat Box"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Description (optional)
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  rows={2}
                  className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-[#7B2220] outline-none resize-none"
                  placeholder="Short description shown to customers…"
                />
              </div>

              {/* Add Products */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                {/* Left: product picker */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-2">
                    Add Products *
                  </label>
                  {/* Search */}
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-[#7B2220] outline-none mb-2"
                    placeholder="Search products…"
                  />
                  {/* Scrollable product list — always visible */}
                  <div className="border-2 border-gray-200 rounded-xl overflow-y-auto max-h-56">
                    {filteredPickerProducts.length === 0 ? (
                      <p className="p-4 text-xs text-gray-400 text-center">No products found</p>
                    ) : (
                      filteredPickerProducts.map((p) => {
                        const alreadyAdded = form.items.some((i) => i.productId === p.id);
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => addProductToBundle(p)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 text-left border-b border-gray-100 last:border-0 transition-colors
                              ${alreadyAdded
                                ? "bg-[#7B2220]/5 hover:bg-[#7B2220]/10"
                                : "hover:bg-gray-50"
                              }`}
                          >
                            {p.image ? (
                              <img src={p.image} alt={p.name} className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
                            ) : (
                              <div className="w-9 h-9 rounded-lg bg-gray-100 flex-shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-gray-900 truncate">{p.name}</div>
                              <div className="text-xs text-gray-400">
                                {p.category && <span className="mr-1">{p.category} ·</span>}
                                €{Number(p.price || 0).toFixed(2)}
                              </div>
                            </div>
                            {alreadyAdded ? (
                              <span className="text-[0.65rem] font-bold text-[#7B2220] bg-[#7B2220]/10 px-1.5 py-0.5 rounded-full flex-shrink-0">
                                Added
                              </span>
                            ) : (
                              <Plus className="w-4 h-4 text-[#7B2220] flex-shrink-0" />
                            )}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Right: selected items */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-2">
                    Bundle Items{" "}
                    {form.items.length > 0 && (
                      <span className="text-gray-400 font-normal">({form.items.length})</span>
                    )}
                  </label>

                  {form.items.length === 0 ? (
                    <div className="border-2 border-dashed border-gray-200 rounded-xl h-56 flex items-center justify-center text-xs text-gray-400 text-center px-4">
                      Select products from the list to add them here
                    </div>
                  ) : (
                    <div className="border-2 border-gray-200 rounded-xl overflow-y-auto max-h-56 divide-y divide-gray-100">
                      {form.items.map((item) => (
                        <div
                          key={item.productId}
                          className="flex items-center gap-2 px-3 py-2.5"
                        >
                          {item.productImage ? (
                            <img src={item.productImage} alt={item.productName} className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-gray-100 flex-shrink-0" />
                          )}
                          <span className="flex-1 text-sm font-medium text-gray-800 truncate min-w-0">
                            {item.productName}
                          </span>
                          {/* Qty controls */}
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                              type="button"
                              onClick={() => updateBundleItemQty(item.productId, item.qty - 1)}
                              disabled={item.qty <= 1}
                              className="w-5 h-5 rounded bg-gray-200 text-gray-700 text-xs font-bold hover:bg-gray-300 disabled:opacity-40 flex items-center justify-center"
                            >
                              −
                            </button>
                            <span className="w-5 text-center text-xs font-semibold">{item.qty}</span>
                            <button
                              type="button"
                              onClick={() => updateBundleItemQty(item.productId, item.qty + 1)}
                              className="w-5 h-5 rounded bg-gray-200 text-gray-700 text-xs font-bold hover:bg-gray-300 flex items-center justify-center"
                            >
                              +
                            </button>
                          </div>
                          <span className="text-xs text-gray-500 w-14 text-right flex-shrink-0">
                            €{(item.productPrice * item.qty).toFixed(2)}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeBundleItem(item.productId)}
                            className="p-1 rounded text-red-400 hover:text-red-600 hover:bg-red-50 flex-shrink-0"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Original total */}
                  {form.items.length > 0 && (
                    <div className="flex justify-between text-xs text-gray-500 px-1 pt-2">
                      <span>Original total:</span>
                      <span className="font-semibold">€{totalOriginalPrice.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Bundle Price */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Bundle Price (€) *
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={form.bundlePrice}
                    onChange={(e) => setForm((p) => ({ ...p, bundlePrice: e.target.value }))}
                    className="flex-1 border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-[#7B2220] outline-none"
                    placeholder="e.g. 15.00"
                  />
                  {savings > 0 && (
                    <span className="text-sm font-semibold text-green-600 whitespace-nowrap">
                      Save €{savings.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>

              {/* Active toggle */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, active: !p.active }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                    ${form.active ? "bg-[#7B2220]" : "bg-gray-300"}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform
                      ${form.active ? "translate-x-6" : "translate-x-1"}`}
                  />
                </button>
                <span className="text-sm font-medium text-gray-700">
                  {form.active ? "Active (visible to customers)" : "Inactive (hidden)"}
                </span>
              </div>
            </div>

            {/* Modal footer */}
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
              <button
                onClick={closeForm}
                className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 text-sm font-semibold hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#7B2220] text-white text-sm font-semibold hover:bg-[#8B3230] disabled:opacity-60"
              >
                {saving ? (
                  "Saving…"
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    {editingId ? "Save Changes" : "Create Bundle"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={closeConfirm}
        onConfirm={() => confirmModal.onConfirm?.()}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
        confirmButtonColor={confirmModal.confirmButtonColor}
      />
    </div>
  );
}

export default BundlesPage;
