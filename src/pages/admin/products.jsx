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

function ProductsPage() {
    const [products, setProducts] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [uploading, setUploading] = useState(false);

    const [newProduct, setNewProduct] = useState({
        name: "",
        price: "",
        description: "",
        category: "",
        imageFile: null,
    });

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

    // 🔹 Fetch products
    useEffect(() => {
        const fetchProducts = async () => {
            const snapshot = await getDocs(productsCollection);
            setProducts(
                snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }))
            );
        };

        fetchProducts();
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

        try {
            setUploading(true);

            let updatedData = {
                name: newProduct.name,
                price: Number(newProduct.price),
                description: newProduct.description,
                category: newProduct.category,
            };

            if (newProduct.imageFile) {
                updatedData.image = await uploadToCloudinary(
                    newProduct.imageFile
                );
            }

            await updateDoc(doc(db, "products", editingId), updatedData);

            setProducts((prev) =>
                prev.map((p) =>
                    p.id === editingId ? { ...p, ...updatedData } : p
                )
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
            name: product.name,
            price: product.price,
            description: product.description,
            category: product.category,
            imageFile: null,
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
                p.id === product.id
                    ? { ...p, available: !p.available }
                    : p
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
            imageFile: null,
        });
    };

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-6">
                Admin Products Page
            </h1>

            <button
                onClick={() => setShowModal(true)}
                className="mb-4 bg-green-500 text-white px-4 py-2 rounded"
            >
                Add Product
            </button>

            {/* 🔹 PRODUCTS TABLE */}
            <table className="w-full border">
                <thead className="bg-gray-100">
                    <tr>
                        <th className="border px-4 py-2">Image</th>
                        <th className="border px-4 py-2">Name</th>
                        <th className="border px-4 py-2">Price</th>
                        <th className="border px-4 py-2">Category</th>
                        <th className="border px-4 py-2">Status</th>
                        <th className="border px-4 py-2">Actions</th>
                    </tr>
                </thead>

                <tbody>
                    {products.map((product) => (
                        <tr key={product.id}>
                            <td className="border px-4 py-2">
                                <img
                                    src={product.image}
                                    className="w-16 h-16 object-cover rounded"
                                />
                            </td>
                            <td className="border px-4 py-2">
                                {product.name}
                            </td>
                            <td className="border px-4 py-2">
                                €{product.price}
                            </td>
                            <td className="border px-4 py-2">
                                {product.category}
                            </td>
                            <td className="border px-4 py-2">
                                {product.available
                                    ? "Available"
                                    : "Not Available"}
                            </td>
                            <td className="border px-4 py-2 space-x-2">
                                <button
                                    onClick={() => handleEdit(product)}
                                    className="bg-blue-500 text-white px-3 py-1 rounded"
                                >
                                    Edit
                                </button>

                                <button
                                    onClick={() =>
                                        toggleAvailability(product)
                                    }
                                    className={`px-3 py-1 rounded text-white ${
                                        product.available
                                            ? "bg-yellow-500"
                                            : "bg-gray-500"
                                    }`}
                                >
                                    {product.available
                                        ? "Disable"
                                        : "Enable"}
                                </button>

                                <button
                                    onClick={() =>
                                        handleDelete(product)
                                    }
                                    className="bg-red-500 text-white px-3 py-1 rounded"
                                >
                                    Delete
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* 🔹 MODAL */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex justify-center items-center">
                    <div className="bg-white p-6 rounded w-96">
                        <h2 className="text-xl font-bold mb-4">
                            {isEditing ? "Edit Product" : "Add Product"}
                        </h2>

                        <input
                            className="border w-full mb-2 px-3 py-2"
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
                            className="border w-full mb-2 px-3 py-2"
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
                            className="border w-full mb-2 px-3 py-2"
                            placeholder="Category (e.g. cookies)"
                            value={newProduct.category}
                            onChange={(e) =>
                                setNewProduct({
                                    ...newProduct,
                                    category: e.target.value,
                                })
                            }
                        />

                        <textarea
                            className="border w-full mb-2 px-3 py-2"
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
                            onChange={(e) =>
                                setNewProduct({
                                    ...newProduct,
                                    imageFile: e.target.files[0],
                                })
                            }
                        />

                        <div className="flex justify-end gap-2 mt-4">
                            <button
                                onClick={resetModal}
                                className="px-4 py-2 bg-gray-300 rounded"
                            >
                                Cancel
                            </button>

                            <button
                                onClick={
                                    isEditing
                                        ? handleUpdateProduct
                                        : handleAddProduct
                                }
                                className="px-4 py-2 bg-green-500 text-white rounded"
                                disabled={uploading}
                            >
                                {uploading
                                    ? "Saving..."
                                    : isEditing
                                    ? "Update"
                                    : "Add"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ProductsPage;
