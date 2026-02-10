import { useState, useEffect } from "react";
import { db } from "../../firebase";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import DataTable from "../common/DataTable";
import Search from "../common/Search";
import Filter from "../common/Filter";
import Pagination from "../common/Pagination";
import { StatusBadge } from "../common/StatusBadge";
import { Trash2, Edit2 } from "lucide-react";

function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);

  // Extract unique categories for filter options
  const categories = Array.from(
    new Set(products.map((p) => p.category).filter(Boolean))
  );


  const filteredProducts = products.filter((product) => {
    const q = search.toLowerCase();

    const matchesSearch =
      product.name?.toLowerCase().includes(q) ||
      product.category?.toLowerCase().includes(q);

    const matchesCategory =
      !categoryFilter || product.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });


  const [newProduct, setNewProduct] = useState({
    name: "",
    price: "",
    description: "",
    category: "",
    dailyLimit: "", // ✅ NEW
    imageFile: null,
    productDiscount: "", // ✅ NEW
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [search, categoryFilter]);

  const productsCollection = collection(db, "products");

  // 🔹 Cloudinary config
  const CLOUD_NAME = "drgjco3qx";
  const UPLOAD_PRESET = "products_unsigned";

  // 🔹 Upload image
  const uploadToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    const data = await res.json();
    if (!data.secure_url) throw new Error("Upload failed");

    return data.secure_url;
  };

  // ✅ Discount parser & validator
  const parseDiscount = (value) => {
    if (!value) return null;

    const v = value.trim();

    // Percentage discount: 10%
    if (/^\d+(\.\d+)?%$/.test(v)) {
      const percent = Number(v.replace("%", ""));
      if (percent <= 0 || percent >= 100) return null;
      return { type: "percent", value: percent };
    }

    // Fixed discount: 5 or €5
    if (/^\d+(\.\d+)?€?$/.test(v)) {
      const amount = Number(v.replace("€", ""));
      if (amount <= 0) return null;
      return { type: "fixed", value: amount };
    }

    return null;
  };


  // 🔹 Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const snapshot = await getDocs(productsCollection);
        setProducts(
          snapshot.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          }))
        );
      } catch (err) {
        console.error("Error fetching products:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 🔹 Add product
  const handleAddProduct = async () => {
    if (
      !newProduct.name ||
      !newProduct.price ||
      !newProduct.description ||
      !newProduct.category ||
      !newProduct.imageFile
    ) {
      alert("Fill all fields");
      return;
    }

    // ✅ Validate discount
    const discountParsed = parseDiscount(newProduct.productDiscount);
    if (!discountParsed) {
      alert("Invalid discount. Use e.g. 10% or 5€");
      return;
    }

    // ✅ allow blank, but if provided must be valid number >= 0
    const limitNum =
      newProduct.dailyLimit === "" || newProduct.dailyLimit === null
        ? null
        : Number(newProduct.dailyLimit);

    if (limitNum !== null && (Number.isNaN(limitNum) || limitNum < 0)) {
      alert("Daily limit must be a number (0 or more).");
      return;
    }

    try {
      setUploading(true);
      const imageUrl = await uploadToCloudinary(newProduct.imageFile);

      const docRef = await addDoc(productsCollection, {
        name: newProduct.name,
        price: Number(newProduct.price),
        image: imageUrl,
        description: newProduct.description,
        category: newProduct.category,
        available: true,
        dailyLimit: limitNum, // ✅ NEW
        productDiscount: discountParsed, // ✅ NEW
      });

      setProducts((prev) => [
        ...prev,
        {
          id: docRef.id,
          name: newProduct.name,
          price: Number(newProduct.price),
          image: imageUrl,
          description: newProduct.description,
          category: newProduct.category,
          available: true,
          dailyLimit: limitNum, // ✅ NEW
          productDiscount: discountParsed, // ✅ NEW
        },
      ]);

      resetModal();
    } catch (err) {
      console.error(err);
      alert("Failed to add product");
    } finally {
      setUploading(false);
    }
  };

  // 🔹 Update product
  const handleUpdateProduct = async () => {
    if (
      !newProduct.name ||
      !newProduct.price ||
      !newProduct.description ||
      !newProduct.category
    ) {
      alert("Fill all fields");
      return;
    }

    const discountParsed = parseDiscount(newProduct.productDiscount);
    if (!discountParsed) {
      alert("Invalid discount. Use e.g. 10% or 5€");
      return;
    }

    const limitNum =
      newProduct.dailyLimit === "" || newProduct.dailyLimit === null
        ? null
        : Number(newProduct.dailyLimit);

    if (limitNum !== null && (Number.isNaN(limitNum) || limitNum < 0)) {
      alert("Daily limit must be a number (0 or more).");
      return;
    }

    try {
      setUploading(true);

      let updatedData = {
        name: newProduct.name,
        price: Number(newProduct.price),
        description: newProduct.description,
        category: newProduct.category,
        dailyLimit: limitNum, // ✅ NEW
        productDiscount: discountParsed, // ✅ NEW
      };

      if (newProduct.imageFile) {
        updatedData.image = await uploadToCloudinary(newProduct.imageFile);
      }

      await updateDoc(doc(db, "products", editingId), updatedData);

      setProducts((prev) =>
        prev.map((p) => (p.id === editingId ? { ...p, ...updatedData } : p))
      );

      resetModal();
    } catch (err) {
      console.error(err);
      alert("Failed to update product");
    } finally {
      setUploading(false);
    }
  };

  // 🔹 Edit product
  const handleEdit = (product) => {
    setIsEditing(true);
    setEditingId(product.id);
    setNewProduct({
      name: product.name ?? "",
      price: product.price ?? "",
      description: product.description ?? "",
      category: product.category ?? "",
      dailyLimit:
        product.dailyLimit === null || typeof product.dailyLimit === "undefined"
          ? ""
          : String(product.dailyLimit), // ✅ NEW
      imageFile: null,
      productDiscount:
        product.productDiscount?.type === "percent"
          ? `${product.productDiscount.value}%`
          : product.productDiscount?.type === "fixed"
          ? `€${product.productDiscount.value}`
          : "", // ✅ NEW
    });
    setShowModal(true);
  };

  // 🔹 Delete product
  const handleDelete = async (product) => {
    if (!window.confirm(`Delete ${product.name}?`)) return;

    await deleteDoc(doc(db, "products", product.id));
    setProducts((prev) => prev.filter((p) => p.id !== product.id));
  };

  // 🔹 Toggle availability
  const toggleAvailability = async (product) => {
    await updateDoc(doc(db, "products", product.id), {
      available: !product.available,
    });

    setProducts((prev) =>
      prev.map((p) =>
        p.id === product.id ? { ...p, available: !p.available } : p
      )
    );
  };

  const resetModal = () => {
    setShowModal(false);
    setIsEditing(false);
    setEditingId(null);
    setNewProduct({
      name: "",
      price: "",
      description: "",
      category: "",
      dailyLimit: "", // ✅ NEW
      imageFile: null,
      productDiscount: "", // ✅ NEW
    });
  };

  // 🔹 Pagination logic (same as OrdersPending)
  const totalPages = Math.ceil(filteredProducts.length / pageSize);

  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const columns = [
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

    // ✅ NEW COLUMN
    {
      key: "productDiscount",
      header: "Product Discount",
      render: (row) => {
        if (!row.productDiscount) return "—";
        return row.productDiscount.type === "percent"
          ? `${row.productDiscount.value}%`
          : `€${row.productDiscount.value}`;
      },
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
        <div className="flex gap-2">
          <button
            onClick={() => handleEdit(row)}
            className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all duration-200 border border-blue-200"
            title="Edit product"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => toggleAvailability(row)}
            className={`px-3 py-2 rounded-lg text-white font-medium transition-all duration-200 ${
              row.available
                ? "bg-yellow-500 hover:bg-yellow-600 shadow-sm"
                : "bg-gray-500 hover:bg-gray-600 shadow-sm"
            }`}
            title={row.available ? "Disable product" : "Enable product"}
          >
            {row.available ? "Disable" : "Enable"}
          </button>
          <button
            onClick={() => handleDelete(row)}
            className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-all duration-200 border border-red-200"
            title="Delete product"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">Products Management</h1>
              <p className="text-sm text-gray-500">Manage your product catalog, pricing, and availability</p>
            </div>

            <button
              onClick={() => setShowModal(true)}
              className="px-6 py-3 rounded-xl bg-[#7B2220] text-white font-semibold hover:bg-[#8B3230] transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2"
            >
              <span>+</span>
              <span>Add Product</span>
            </button>
          </div>

          {/* Search + Filter */}
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
                      {isEditing ? "Update product information" : "Fill in the details to add a new product"}
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
                      setNewProduct({
                        ...newProduct,
                        name: e.target.value,
                      })
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
                        setNewProduct({
                          ...newProduct,
                          price: e.target.value,
                        })
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
                        setNewProduct({
                          ...newProduct,
                          category: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                {/* Daily Limit and Discount Row */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Daily Limit
                      <span className="text-xs text-gray-500 ml-2">(optional)</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-[#7B2220] focus:ring-2 focus:ring-[#7B2220]/20 outline-none transition-all"
                      placeholder="Leave empty for unlimited"
                      value={newProduct.dailyLimit}
                      onChange={(e) =>
                        setNewProduct({
                          ...newProduct,
                          dailyLimit: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Product Discount
                      <span className="text-xs text-gray-500 ml-2">(e.g. 10% or 5€)</span>
                    </label>
                    <input
                      type="text"
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-[#7B2220] focus:ring-2 focus:ring-[#7B2220]/20 outline-none transition-all"
                      placeholder="10% or 5€"
                      value={newProduct.productDiscount}
                      onChange={(e) =>
                        setNewProduct({
                          ...newProduct,
                          productDiscount: e.target.value,
                        })
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
                      setNewProduct({
                        ...newProduct,
                        description: e.target.value,
                      })
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
                        setNewProduct({
                          ...newProduct,
                          imageFile: e.target.files[0],
                        })
                      }
                    />
                  </label>
                  {isEditing && newProduct.imageFile && (
                    <p className="text-xs text-gray-500 mt-1">
                      New image will replace the existing one
                    </p>
                  )}
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
      </div>
    </div>
  );
}

export default ProductsPage;
