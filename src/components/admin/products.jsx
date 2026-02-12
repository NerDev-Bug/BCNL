import { useState, useEffect, useCallback } from "react"
import { db } from "../../firebase"
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  writeBatch,
} from "firebase/firestore"
import DataTable from "../common/DataTable"
import Search from "../common/Search"
import Filter from "../common/Filter"
import Pagination from "../common/Pagination"
import { StatusBadge } from "../common/StatusBadge"
import ConfirmationModal from "../common/ConfirmationModal"
import { Edit2, Trash2, Eye, EyeOff, Power } from "lucide-react"

function ProductsPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("")
  const [menuFilter, setMenuFilter] = useState("") // "" | "shown" | "hidden"
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(10)

  // ✅ NEW: selection for bulk actions
  const [selectedIds, setSelectedIds] = useState([])

  // ✅ Confirmation modal state
  const [confirmationModal, setConfirmationModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: null,
    type: "confirm",
    confirmButtonColor: "bg-[#7B2220]",
    confirmText: "Confirm",
    cancelText: "Cancel",
  })

  // ✅ No products modal state
  const [noProductsModal, setNoProductsModal] = useState({
    isOpen: false,
  })

  const closeConfirmationModal = () => {
    setConfirmationModal((prev) => ({ ...prev, isOpen: false }))
  }

  const closeNoProductsModal = () => {
    setNoProductsModal({ isOpen: false })
  }

  // Extract unique categories for filter options
  const categories = Array.from(
    new Set(products.map((p) => p.category).filter(Boolean))
  )

  useEffect(() => {
    setCurrentPage(1)
  }, [search, categoryFilter, menuFilter])

  // 🔹 Cloudinary config
  const CLOUD_NAME = "drgjco3qx"
  const UPLOAD_PRESET = "products_unsigned"

  // 🔹 Upload image
  const uploadToCloudinary = async (file) => {
    const formData = new FormData()
    formData.append("file", file)
    formData.append("upload_preset", UPLOAD_PRESET)

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      { method: "POST", body: formData }
    )

    const data = await res.json()
    if (!data.secure_url) throw new Error("Upload failed")
    return data.secure_url
  }

  // ✅ Daily reset function - reset all shown products to hidden
  const resetDailyMenuProducts = useCallback(async () => {
    try {
      const productsCollection = collection(db, "products")
      const snapshot = await getDocs(productsCollection)
      const shownProducts = snapshot.docs.filter(
        (d) => d.data().showOnMenu === true
      )

      if (shownProducts.length > 0) {
        const batch = writeBatch(db)
        shownProducts.forEach((docSnapshot) => {
          batch.update(doc(db, "products", docSnapshot.id), {
            showOnMenu: false,
          })
        })
        await batch.commit()

        // Update local state
        setProducts((prev) =>
          prev.map((p) => ({ ...p, showOnMenu: false }))
        )
      }
    } catch (err) {
      console.error("Error resetting daily menu products:", err)
    }
  }, [])

  // ✅ Check if it's a new day and reset if needed
  useEffect(() => {
    const checkAndResetDaily = async () => {
      const today = new Date().toDateString()
      const lastResetDate = localStorage.getItem("productsMenuLastReset")

      if (lastResetDate !== today) {
        // It's a new day, reset all shown products to hidden
        await resetDailyMenuProducts()
        localStorage.setItem("productsMenuLastReset", today)
      }
    }

    checkAndResetDaily()
  }, [resetDailyMenuProducts])

  // 🔹 Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const productsCollection = collection(db, "products")
        const snapshot = await getDocs(productsCollection)
        const productsData = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }))
        setProducts(productsData)

        // ✅ Check if there are any products shown in menu
        const hasShownProducts = productsData.some((p) => p.showOnMenu === true)
        if (!hasShownProducts) {
          // Wait a bit for the reset to complete, then show modal
          setTimeout(() => {
            setNoProductsModal({ isOpen: true })
          }, 500)
        }
      } catch (err) {
        console.error("Error fetching products:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  // 🔹 Add product
  const handleAddProduct = async () => {
    if (
      !newProduct.name ||
      !newProduct.price ||
      !newProduct.description ||
      !newProduct.category ||
      !newProduct.imageFile
    ) {
      setConfirmationModal({
        isOpen: true,
        title: "Validation Error",
        message: "Fill all fields",
        onConfirm: closeConfirmationModal,
        type: "alert",
        confirmButtonColor: "bg-[#7B2220]",
      })
      return
    }

    const limitNum =
      newProduct.dailyLimit === "" || newProduct.dailyLimit === null
        ? null
        : Number(newProduct.dailyLimit)

    if (limitNum !== null && (Number.isNaN(limitNum) || limitNum < 0)) {
      setConfirmationModal({
        isOpen: true,
        title: "Validation Error",
        message: "Daily limit must be a number (0 or more).",
        onConfirm: closeConfirmationModal,
        type: "alert",
        confirmButtonColor: "bg-[#7B2220]",
      })
      return
    }

    try {
      setUploading(true)
      const imageUrl = await uploadToCloudinary(newProduct.imageFile)

      const payload = {
        name: newProduct.name,
        price: Number(newProduct.price),
        image: imageUrl,
        description: newProduct.description,
        category: newProduct.category,
        available: true,
        dailyLimit: limitNum,
        productDiscount: null,

        // ✅ NEW: default show on menu
        showOnMenu: true,
      }

      const productsCollection = collection(db, "products")
      const docRef = await addDoc(productsCollection, payload)

      setProducts((prev) => [...prev, { id: docRef.id, ...payload }])

      resetModal()
    } catch (err) {
      console.error(err)
      setConfirmationModal({
        isOpen: true,
        title: "Error",
        message: "Failed to add product",
        onConfirm: closeConfirmationModal,
        type: "alert",
        confirmButtonColor: "bg-red-600",
      })
    } finally {
      setUploading(false)
    }
  }

  // 🔹 Update product
  const handleUpdateProduct = async () => {
    if (
      !newProduct.name ||
      !newProduct.price ||
      !newProduct.description ||
      !newProduct.category
    ) {
      setConfirmationModal({
        isOpen: true,
        title: "Validation Error",
        message: "Fill all fields",
        onConfirm: closeConfirmationModal,
        type: "alert",
        confirmButtonColor: "bg-[#7B2220]",
      })
      return
    }

    const limitNum =
      newProduct.dailyLimit === "" || newProduct.dailyLimit === null
        ? null
        : Number(newProduct.dailyLimit)

    if (limitNum !== null && (Number.isNaN(limitNum) || limitNum < 0)) {
      setConfirmationModal({
        isOpen: true,
        title: "Validation Error",
        message: "Daily limit must be a number (0 or more).",
        onConfirm: closeConfirmationModal,
        type: "alert",
        confirmButtonColor: "bg-[#7B2220]",
      })
      return
    }

    try {
      setUploading(true)

      let updatedData = {
        name: newProduct.name,
        price: Number(newProduct.price),
        description: newProduct.description,
        category: newProduct.category,
        dailyLimit: limitNum,
        // ✅ keep showOnMenu as-is (don’t overwrite here)
      }

      if (newProduct.imageFile) {
        updatedData.image = await uploadToCloudinary(newProduct.imageFile)
      }

      await updateDoc(doc(db, "products", editingId), updatedData)

      setProducts((prev) =>
        prev.map((p) => (p.id === editingId ? { ...p, ...updatedData } : p))
      )

      resetModal()
    } catch (err) {
      console.error(err)
      setConfirmationModal({
        isOpen: true,
        title: "Error",
        message: "Failed to update product",
        onConfirm: closeConfirmationModal,
        type: "alert",
        confirmButtonColor: "bg-red-600",
      })
    } finally {
      setUploading(false)
    }
  }

  // 🔹 Edit product
  const handleEdit = (product) => {
    setIsEditing(true)
    setEditingId(product.id)
    setNewProduct({
      name: product.name ?? "",
      price: product.price ?? "",
      description: product.description ?? "",
      category: product.category ?? "",
      dailyLimit:
        product.dailyLimit === null || typeof product.dailyLimit === "undefined"
          ? ""
          : String(product.dailyLimit),
      imageFile: null,
    })
    setShowModal(true)
  }

  // 🔹 Delete product
  const handleDelete = (product) => {
    setConfirmationModal({
      isOpen: true,
      title: "Delete Product",
      message: `Are you sure you want to delete "${product.name}"? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, "products", product.id))
          setProducts((prev) => prev.filter((p) => p.id !== product.id))
          setSelectedIds((prev) => prev.filter((id) => id !== product.id))
          closeConfirmationModal()
        } catch (err) {
          console.error("Delete failed:", err)
          setConfirmationModal({
            isOpen: true,
            title: "Error",
            message: "Failed to delete product",
            onConfirm: closeConfirmationModal,
            type: "alert",
            confirmButtonColor: "bg-red-600",
          })
        }
      },
      type: "confirm",
      confirmButtonColor: "bg-red-600",
      confirmText: "Yes, Delete",
      cancelText: "Cancel",
    })
  }

  // 🔹 Toggle availability
  const toggleAvailability = async (product) => {
    await updateDoc(doc(db, "products", product.id), {
      available: !product.available,
    })

    setProducts((prev) =>
      prev.map((p) =>
        p.id === product.id ? { ...p, available: !p.available } : p
      )
    )
  }

  // ✅ NEW: Toggle showOnMenu (per product)
  const toggleShowOnMenu = async (product) => {
    const next = !product.showOnMenu
    await updateDoc(doc(db, "products", product.id), {
      showOnMenu: next,
    })

    setProducts((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, showOnMenu: next } : p))
    )
  }

  // ✅ NEW: bulk set showOnMenu for selected products
  const bulkSetShowOnMenu = async (value) => {
    if (selectedIds.length === 0) {
      setConfirmationModal({
        isOpen: true,
        title: "No Selection",
        message: "Select at least 1 product first.",
        onConfirm: closeConfirmationModal,
        type: "alert",
        confirmButtonColor: "bg-[#7B2220]",
      })
      return
    }

    try {
      setUploading(true)
      const batch = writeBatch(db)

      selectedIds.forEach((id) => {
        batch.update(doc(db, "products", id), { showOnMenu: value })
      })

      await batch.commit()

      setProducts((prev) =>
        prev.map((p) =>
          selectedIds.includes(p.id) ? { ...p, showOnMenu: value } : p
        )
      )

      setSelectedIds([])
    } catch (e) {
      console.error("Bulk update failed:", e)
      setConfirmationModal({
        isOpen: true,
        title: "Error",
        message: "Bulk update failed",
        onConfirm: closeConfirmationModal,
        type: "alert",
        confirmButtonColor: "bg-red-600",
      })
    } finally {
      setUploading(false)
    }
  }

  const resetModal = () => {
    setShowModal(false)
    setIsEditing(false)
    setEditingId(null)
    setNewProduct({
      name: "",
      price: "",
      description: "",
      category: "",
      dailyLimit: "",
      imageFile: null,
    })
  }

  const [newProduct, setNewProduct] = useState({
    name: "",
    price: "",
    description: "",
    category: "",
    dailyLimit: "",
    imageFile: null,
  })

  // ✅ Filters
  const filteredProducts = products.filter((product) => {
    const q = search.toLowerCase()

    const matchesSearch =
      product.name?.toLowerCase().includes(q) ||
      product.category?.toLowerCase().includes(q)

    const matchesCategory =
      !categoryFilter || product.category === categoryFilter

    const isShown = Boolean(product.showOnMenu)
    const matchesMenu =
      !menuFilter ||
      (menuFilter === "shown" && isShown) ||
      (menuFilter === "hidden" && !isShown)

    return matchesSearch && matchesCategory && matchesMenu
  })

  // 🔹 Pagination
  const totalPages = Math.ceil(filteredProducts.length / pageSize)

  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  // ✅ NEW: select helpers
  const toggleSelectOne = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const toggleSelectAllCurrentPage = () => {
    const idsOnPage = paginatedProducts.map((p) => p.id)
    const allSelected = idsOnPage.every((id) => selectedIds.includes(id))

    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !idsOnPage.includes(id)))
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...idsOnPage])))
    }
  }

  const columns = [
    // ✅ NEW: Select checkbox column
    {
      key: "__select",
      header: (
        <input
          type="checkbox"
          onChange={toggleSelectAllCurrentPage}
          checked={
            paginatedProducts.length > 0 &&
            paginatedProducts.every((p) => selectedIds.includes(p.id))
          }
        />
      ),
      render: (row) => (
        <input
          type="checkbox"
          checked={selectedIds.includes(row.id)}
          onChange={() => toggleSelectOne(row.id)}
        />
      ),
    },
    {
      key: "image",
      header: "Image",
      render: (row) => (
        <img
          src={row.image}
          alt={row.name}
          className="w-16 h-16 object-cover rounded-xl border-2 border-gray-200 shadow-sm"
        />
      ),
    },
    {
      key: "name",
      header: "Name",
      render: (row) => row.name,
    },
    {
      key: "price",
      header: "Price",
      render: (row) => `€${row.price}`,
    },
    {
      key: "category",
      header: "Category",
      render: (row) => row.category,
    },

    // ✅ NEW: show on menu column
    {
      key: "showOnMenu",
      header: "Menu",
      render: (row) => (
        <span
          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
            row.showOnMenu ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-600"
          }`}
        >
          {row.showOnMenu ? "Shown" : "Hidden"}
        </span>
      ),
    },

    {
      key: "available",
      header: "Status",
      render: (row) => (
        <StatusBadge value={row.available ? "available" : "unavailable"} />
      ),
    },
    {
      key: "dailyLimit",
      header: "Daily Limit",
      render: (row) => row.dailyLimit ?? "—",
    },
{
  key: "actions",
  header: "Actions",
  render: (row) => (
    <div className="flex items-center justify-center gap-2 min-w-[150px]">
      {/* EDIT */}
      <button
        onClick={() => handleEdit(row)}
        title="Edit product"
        className="p-2 rounded-lg bg-blue-50 text-blue-600
          hover:bg-blue-100 border border-blue-200 transition"
      >
        <Edit2 className="w-4 h-4" />
      </button>

      {/* SHOW / HIDE ON MENU */}
      <button
        onClick={() => toggleShowOnMenu(row)}
        title={row.showOnMenu ? "Hide from menu" : "Show on menu"}
        className={`p-2 rounded-lg border transition
          ${
            row.showOnMenu
              ? "bg-green-50 text-green-600 border-green-200 hover:bg-green-100"
              : "bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200"
          }`}
      >
        {row.showOnMenu ? (
          <Eye className="w-4 h-4" />
        ) : (
          <EyeOff className="w-4 h-4" />
        )}
      </button>

      {/* ENABLE / DISABLE */}
      <button
        onClick={() => toggleAvailability(row)}
        title={row.available ? "Disable product" : "Enable product"}
        className={`p-2 rounded-lg border transition
          ${
            row.available
              ? "bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100"
              : "bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200"
          }`}
      >
        <Power className="w-4 h-4" />
      </button>

      {/* DELETE */}
      <button
        onClick={() => handleDelete(row)}
        title="Delete product"
        className="p-2 rounded-lg bg-red-50 text-red-600
          hover:bg-red-100 border border-red-200 transition"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  ),
}
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">
                Products Management
              </h1>
              <p className="text-sm text-gray-500">
                Manage your product catalog, pricing, availability, and menu display
              </p>
            </div>

            <button
              onClick={() => setShowModal(true)}
              className="px-6 py-3 rounded-xl bg-[#7B2220] text-white font-semibold hover:bg-[#8B3230] transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2"
            >
              <span>+</span>
              <span>Add Product</span>
            </button>
          </div>

          {/* ✅ TOP BAR: Search + Filters + Bulk menu controls */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex flex-wrap items-end gap-4">
              <div className="flex-1 min-w-[250px]">
                <Search
                  value={search}
                  onChange={setSearch}
                  placeholder="Search by name or category"
                />
              </div>

              <div className="min-w-[200px]">
                <Filter
                  label="Filter by Category"
                  value={categoryFilter}
                  options={categories}
                  onChange={setCategoryFilter}
                />
              </div>

              {/* ✅ NEW: Menu display filter */}
              <div className="min-w-[220px]">
                <Filter
                  label="Menu Display"
                  value={menuFilter}
                  options={[
                    "shown",
                    "hidden",
                  ]}
                  onChange={setMenuFilter}
                />
              </div>

              {/* ✅ NEW: Bulk actions */}
              <div className="flex gap-2">
                <button
                  disabled={uploading || selectedIds.length === 0}
                  onClick={() => bulkSetShowOnMenu(true)}
                  className="px-4 py-3 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Show selected products on the menu"
                >
                  Show Selected
                </button>
                <button
                  disabled={uploading || selectedIds.length === 0}
                  onClick={() => {
                    setConfirmationModal({
                      isOpen: true,
                      title: "Hide Products",
                      message: `Are you sure you want to hide ${selectedIds.length} selected product(s) from the menu?`,
                      onConfirm: () => {
                        bulkSetShowOnMenu(false)
                        closeConfirmationModal()
                      },
                      type: "confirm",
                      confirmButtonColor: "bg-gray-700",
                    })
                  }}
                  className="px-4 py-3 rounded-xl bg-gray-700 text-white font-semibold hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Hide selected products from the menu"
                >
                  Hide Selected
                </button>
              </div>
            </div>

            {/* selected count */}
            <div className="mt-3 text-xs text-gray-500">
              Selected: <span className="font-semibold">{selectedIds.length}</span>
            </div>
          </div>
        </div>

        {/* TABLE */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <DataTable columns={columns} data={paginatedProducts} loading={loading} />
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

        {/* MODAL */}
        {showModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 px-8 py-6 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {isEditing ? "Edit Product" : "Add New Product"}
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                      {isEditing
                        ? "Update product information"
                        : "Fill in the details to add a new product"}
                    </p>
                  </div>
                  <button
                    onClick={resetModal}
                    className="text-gray-400 hover:text-gray-600 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-all"
                  >
                    ×
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-8 space-y-6">
                {/* Product Name */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Product Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-[#7B2220] focus:ring-2 focus:ring-[#7B2220]/20 outline-none transition-all"
                    placeholder="Enter product name"
                    value={newProduct.name}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, name: e.target.value })
                    }
                  />
                </div>

                {/* Price and Category Row */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Price (€) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-[#7B2220] focus:ring-2 focus:ring-[#7B2220]/20 outline-none transition-all"
                      placeholder="0.00"
                      value={newProduct.price}
                      onChange={(e) =>
                        setNewProduct({ ...newProduct, price: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Category <span className="text-red-500">*</span>
                    </label>
                    <input
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-[#7B2220] focus:ring-2 focus:ring-[#7B2220]/20 outline-none transition-all"
                      placeholder="e.g. cookies, cakes"
                      value={newProduct.category}
                      onChange={(e) =>
                        setNewProduct({ ...newProduct, category: e.target.value })
                      }
                    />
                  </div>
                </div>

                {/* Daily Limit */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Daily Limit
                      <span className="text-xs text-gray-500 ml-2">
                        (optional)
                      </span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-[#7B2220] focus:ring-2 focus:ring-[#7B2220]/20 outline-none transition-all"
                      placeholder="Leave empty for unlimited"
                      value={newProduct.dailyLimit}
                      onChange={(e) =>
                        setNewProduct({ ...newProduct, dailyLimit: e.target.value })
                      }
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-[#7B2220] focus:ring-2 focus:ring-[#7B2220]/20 outline-none transition-all resize-none"
                    rows={4}
                    placeholder="Enter product description..."
                    value={newProduct.description}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, description: e.target.value })
                    }
                  />
                </div>

                {/* Image Upload */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Product Image {!isEditing && <span className="text-red-500">*</span>}
                  </label>
                  <label className="block">
                    <div className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-[#7B2220] hover:bg-[#7B2220]/5 transition-all duration-200">
                      <div className="text-center">
                        <div className="text-3xl mb-2">📷</div>
                        <span className="text-sm text-gray-600">
                          {newProduct.imageFile
                            ? newProduct.imageFile.name
                            : isEditing
                            ? "Click to change image (optional)"
                            : "Click to upload image"}
                        </span>
                      </div>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) =>
                        setNewProduct({ ...newProduct, imageFile: e.target.files[0] })
                      }
                    />
                  </label>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-8 py-6 rounded-b-2xl flex justify-end gap-4">
                <button
                  onClick={resetModal}
                  className="px-6 py-3 rounded-xl border-2 border-gray-300 text-gray-700 font-medium hover:bg-gray-100 transition-all duration-200"
                >
                  Cancel
                </button>

                <button
                  onClick={isEditing ? handleUpdateProduct : handleAddProduct}
                  className="px-8 py-3 rounded-xl bg-[#7B2220] text-white font-semibold hover:bg-[#8B3230] transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  disabled={uploading}
                >
                  {uploading ? (
                    <>
                      <span className="animate-spin">⏳</span>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <span>{isEditing ? "💾" : "➕"}</span>
                      <span>{isEditing ? "Update Product" : "Add Product"}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Modal */}
        <ConfirmationModal
          isOpen={confirmationModal.isOpen}
          onClose={closeConfirmationModal}
          onConfirm={() => {
            if (confirmationModal.onConfirm) {
              confirmationModal.onConfirm()
            }
          }}
          title={confirmationModal.title}
          message={confirmationModal.message}
          type={confirmationModal.type}
          confirmButtonColor={confirmationModal.confirmButtonColor}
          confirmText={confirmationModal.confirmText || "Confirm"}
          cancelText={confirmationModal.cancelText || "Cancel"}
          loading={uploading}
        />

        {/* No Products Modal */}
        <ConfirmationModal
          isOpen={noProductsModal.isOpen}
          onClose={closeNoProductsModal}
          onConfirm={closeNoProductsModal}
          title="No Products in Menu"
          message="You don't have any items/products in Menu for today. I would advise you to add a product/items to display."
          type="alert"
          confirmButtonColor="bg-[#7B2220]"
          confirmText="Got it"
        />
      </div>
    </div>
  )
}

export default ProductsPage
