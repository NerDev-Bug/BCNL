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
          className="w-12 h-12 object-cover rounded"
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
            className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600 transition"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => toggleAvailability(row)}
            className={`px-3 py-2 rounded text-white transition ${
              row.available
                ? "bg-yellow-500 hover:bg-yellow-600"
                : "bg-gray-500 hover:bg-gray-600"
            }`}
          >
            {row.available ? "Disable" : "Enable"}
          </button>
          <button
            onClick={() => handleDelete(row)}
            className="bg-red-500 text-white p-2 rounded hover:bg-red-600 transition"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-8">
      <div className="mb-6 space-y-4">
        {/* HEADER */}
        <div className="mb-6 space-y-4">
          {/* Top row: Title + Add */}
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-800">
              Products
            </h1>

            <button
              onClick={() => setShowModal(true)}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition"
            >
              Add Product
            </button>
          </div>

          {/* Second row: Search + Filter */}
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="w-full md:max-w-md">
              <Search
                value={search}
                onChange={setSearch}
                placeholder="Search by name or category"
              />
            </div>

            <Filter
              label="Filter by Category"
              value={categoryFilter}
              options={categories}
              onChange={setCategoryFilter}
            />
          </div>
        </div>
      </div>

      {/* 🔹 TABLE */}
      <div className="bg-white rounded-lg border border-gray-200">
        <DataTable
          columns={columns}
          data={paginatedProducts}
          loading={loading}
        />
      </div>

      {/* 🔹 PAGINATION */}
      <div className="mt-6 flex justify-center">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* 🔹 MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded w-96 shadow-xl">
            <h2 className="text-xl font-bold mb-4">
              {isEditing ? "Edit Product" : "Add Product"}
            </h2>

            <input
              className="border w-full mb-2 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Name"
              value={newProduct.name}
              onChange={(e) =>
                setNewProduct({
                  ...newProduct,
                  name: e.target.value,
                })
              }
            />

            <input
              type="number"
              className="border w-full mb-2 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Price"
              value={newProduct.price}
              onChange={(e) =>
                setNewProduct({
                  ...newProduct,
                  price: e.target.value,
                })
              }
            />

            <input
              className="border w-full mb-2 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Category (e.g. cookies)"
              value={newProduct.category}
              onChange={(e) =>
                setNewProduct({
                  ...newProduct,
                  category: e.target.value,
                })
              }
            />

            {/* ✅ NEW INPUT */}
            <input
              type="number"
              min="0"
              className="border w-full mb-2 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Daily limit (optional)"
              value={newProduct.dailyLimit}
              onChange={(e) =>
                setNewProduct({
                  ...newProduct,
                  dailyLimit: e.target.value,
                })
              }
            />

            <input
              type="text"
              className="border w-full mb-4 px-3 py-2 rounded"
              placeholder="Product Discount (e.g. 10% or 5€)"
              value={newProduct.productDiscount}
              onChange={(e) =>
                setNewProduct({
                  ...newProduct,
                  productDiscount: e.target.value,
                })
              }
            />

            <textarea
              className="border w-full mb-2 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Description"
              value={newProduct.description}
              onChange={(e) =>
                setNewProduct({
                  ...newProduct,
                  description: e.target.value,
                })
              }
            />

            <input
              type="file"
              className="border w-full mb-4 px-3 py-2 rounded"
              onChange={(e) =>
                setNewProduct({
                  ...newProduct,
                  imageFile: e.target.files[0],
                })
              }
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={resetModal}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 transition"
              >
                Cancel
              </button>

              <button
                onClick={isEditing ? handleUpdateProduct : handleAddProduct}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition disabled:opacity-60"
                disabled={uploading}
              >
                {uploading ? "Saving..." : isEditing ? "Update" : "Add"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductsPage;
