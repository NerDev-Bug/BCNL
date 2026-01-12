import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);

  useEffect(() => {
    const fetchProduct = async () => {
      const docRef = doc(db, "products", id);
      const snap = await getDoc(docRef);

      if (snap.exists()) {
        setProduct({ id: snap.id, ...snap.data() });
      }
    };

    fetchProduct();
  }, [id]);

  if (!product) {
    return <div className="text-center py-20">Loading...</div>;
  }

  return (
    <div className="bg-cover bg-center min-h-screen"
      style={{ backgroundImage: `url('/images/gingham_pattern_purple_bg.jpg')` }}
    >
      <div className="max-w-5xl mx-auto bg-white mt-10 p-8 rounded-md border border-[#7B2220]">

        {/* Breadcrumb */}
        <p className="text-sm text-gray-500 mb-6">
          Menu &gt; cookies &gt; <span className="font-semibold">{product.name}</span>
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* Image */}
          <img
            src={product.image}
            alt={product.name}
            className="w-full rounded-md border"
          />

          {/* Info */}
          <div>
            <h1 className="text-3xl font-bold text-[#7B2220]">
              {product.name}
            </h1>

            <p className="mt-2 text-lg font-semibold text-[#7B2220]">
              ₱{product.price}
            </p>

            <p className="mt-4 text-gray-600">
              {product.description || "No description available."}
            </p>

            <div className="mt-6 flex gap-4">
              <button className="border border-[#7B2220] px-4 py-2 rounded-md">
                Add to Wishlist
              </button>
              <button className="bg-[#7B2220] text-white px-4 py-2 rounded-md">
                Order Now
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
