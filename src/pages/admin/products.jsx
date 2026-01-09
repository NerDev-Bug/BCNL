import { useState, useEffect } from "react";
import { db } from "../../firebase";
import { collection, addDoc, getDocs, deleteDoc, doc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

function ProductsPage() {
    const [products, setProducts] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [newProduct, setNewProduct] = useState({ name: "", price: "", imageFile: null });
    const [uploading, setUploading] = useState(false);

    const productsCollection = collection(db, "products");
    const storage = getStorage();

    // Fetch products from Firestore
    useEffect(() => {
        const fetchProducts = async () => {
            const snapshot = await getDocs(productsCollection);
            const productsData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
            setProducts(productsData);
        };
        fetchProducts();
    }, []);

    const handleAddProduct = async () => {
        if (!newProduct.name || !newProduct.price || !newProduct.imageFile) {
            alert("Please fill in all fields");
            return;
        }

        try {
            setUploading(true);

            // Upload image to Firebase Storage
            const imageRef = ref(storage, `products/${newProduct.imageFile.name}-${Date.now()}`);
            await uploadBytes(imageRef, newProduct.imageFile);
            const imageUrl = await getDownloadURL(imageRef);

            // Add product to Firestore
            const docRef = await addDoc(productsCollection, {
                name: newProduct.name,
                price: Number(newProduct.price),
                image: imageUrl,
            });

            setProducts([
                ...products,
                { id: docRef.id, name: newProduct.name, price: Number(newProduct.price), image: imageUrl },
            ]);

            setNewProduct({ name: "", price: "", imageFile: null });
            setShowModal(false);
        } catch (error) {
            console.error("Error adding product:", error);
            alert("Failed to add product");
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (product) => {
        if (window.confirm(`Are you sure you want to delete ${product.name}?`)) {
            try {
                await deleteDoc(doc(db, "products", product.id));
                setProducts(products.filter((p) => p.id !== product.id));
            } catch (error) {
                console.error("Error deleting product:", error);
                alert("Failed to delete product");
            }
        }
    };

    const handleEdit = (product) => {
        alert(`Edit product: ${product.name}`); // later can open modal
    };

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-6">Admin Products Page</h1>

            <button
                onClick={() => setShowModal(true)}
                className="mb-4 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
                Add Product
            </button>

            <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200">
                    <thead>
                        <tr className="bg-gray-100 text-left">
                            <th className="py-2 px-4 border-b">ID</th>
                            <th className="py-2 px-4 border-b">Image</th>
                            <th className="py-2 px-4 border-b">Name</th>
                            <th className="py-2 px-4 border-b">Price</th>
                            <th className="py-2 px-4 border-b">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map((product) => (
                            <tr key={product.id} className="hover:bg-gray-50">
                                <td className="py-2 px-4 border-b">{product.id}</td>
                                <td className="py-2 px-4 border-b">
                                    <img
                                        src={product.image}
                                        alt={product.name}
                                        className="w-16 h-16 object-cover rounded"
                                    />
                                </td>
                                <td className="py-2 px-4 border-b">{product.name}</td>
                                <td className="py-2 px-4 border-b">₱{product.price}</td>
                                <td className="py-2 px-4 border-b">
                                    <button
                                        onClick={() => handleEdit(product)}
                                        className="bg-blue-500 text-white px-3 py-1 rounded mr-2 hover:bg-blue-600"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(product)}
                                        className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Add Product Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
                    <div className="bg-white p-6 rounded shadow-lg w-96">
                        <h2 className="text-xl font-bold mb-4">Add New Product</h2>
                        <div className="flex flex-col gap-3">
                            <input
                                type="text"
                                placeholder="Product Name"
                                value={newProduct.name}
                                onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                                className="border px-3 py-2 rounded w-full"
                            />
                            <input
                                type="number"
                                placeholder="Price"
                                value={newProduct.price}
                                onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                                className="border px-3 py-2 rounded w-full"
                            />
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => setNewProduct({ ...newProduct, imageFile: e.target.files[0] })}
                                className="border px-3 py-2 rounded w-full"
                            />
                        </div>
                        <div className="mt-4 flex justify-end gap-2">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400"
                                disabled={uploading}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddProduct}
                                className="px-4 py-2 rounded bg-green-500 text-white hover:bg-green-600"
                                disabled={uploading}
                            >
                                {uploading ? "Uploading..." : "Add"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ProductsPage;
