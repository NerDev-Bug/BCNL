import { useParams, Link, useNavigate } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import { db, auth } from "../firebase";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  limit,
  setDoc,
  serverTimestamp,
  orderBy,
} from "firebase/firestore";
import { Search } from "lucide-react";
import { useCart } from "../context/CartContext";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function ProductDetails() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const { addToCart } = useCart();

  // Custom cakes form
  const [customForm, setCustomForm] = useState({
    deliveryDate: "",
    deliveryTime: "",
    quantity: 1,
    size: "REGULAR",
    candles: "-",
    cardMessage: "",
  });

  const isCustomCakes = useMemo(
    () => (product?.category || "").trim().toLowerCase() === "custom cakes",
    [product]
  );

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!search.trim()) return;
    navigate(`/menu?search=${encodeURIComponent(search.trim())}`);
  };

  const filteredRelated = relatedProducts.filter((p) =>
    (p.name || "").toLowerCase().includes(search.toLowerCase())
  );

  const addToWishlist = async (prod) => {
    const user = auth.currentUser;
    if (!user) {
      toast.info("Please login to add items to wishlist ❤️");
      window.openLoginModal?.();
      return;
    }

    const saved = JSON.parse(localStorage.getItem("wishlist")) || [];
    const exists = saved.some((p) => p.id === prod.id);
    if (exists) {
      toast.info("Already in your wishlist 💖");
      return;
    }

    const updated = [...saved, prod];
    localStorage.setItem("wishlist", JSON.stringify(updated));

    try {
      const wishRef = doc(db, "users", user.uid, "wishlist", prod.id);
      await setDoc(
        wishRef,
        {
          id: prod.id,
          name: prod.name,
          price: prod.price,
          image: prod.image,
          category: prod.category || "",
          available: prod.available ?? true,
          createdAt: serverTimestamp(),
        },
        { merge: true }
      );
      toast.success("Added to wishlist ❤️");
    } catch (err) {
      console.error("Add to wishlist failed:", err);
      toast.error("Failed to add to wishlist 😢");
    }
  };

  const updateCustomForm = (patch) => {
    setCustomForm((prev) => ({ ...prev, ...patch }));
  };

  const incQty = () => {
    updateCustomForm({ quantity: Math.min(99, (customForm.quantity || 1) + 1) });
  };

  const decQty = () => {
    updateCustomForm({ quantity: Math.max(1, (customForm.quantity || 1) - 1) });
  };

  const applyPreset = (type) => {
    const presets = {
      Birthday: "Happy Birthday, [Name]! 🎂",
      Romance: "I love you, [Name] ❤️",
      Anniversary: "Happy Anniversary, [Name] 💕",
      "Get well soon": "Get well soon, [Name] 🌷",
      Apology: "I’m sorry, [Name]. Please forgive me.",
    };
    updateCustomForm({ cardMessage: presets[type] || "" });
  };

  const handleOrderNow = () => {
    if (!product) return;

    if (isCustomCakes) {
      if (!customForm.deliveryDate) return toast.info("Please select a delivery date 📅");
      if (!customForm.deliveryTime) return toast.info("Please select a delivery time ⏰");
      if (!customForm.cardMessage.trim()) return toast.info("Please write a card message 💌");
      if (customForm.cardMessage.trim().split(/\s+/).length > 250)
        return toast.info("Card message must be 250 words max ✍️");
    }

    const cartItem = isCustomCakes
      ? { ...product, customization: { ...customForm } }
      : product;

    const success = addToCart(cartItem);
    if (!success) {
      toast.info("Please login to place an order 🛒");
      window.openLoginModal?.();
      return;
    }

    toast.success("Added to cart 🛒");
  };

  // ====== REVIEWS STATE ======
  const [reviews, setReviews] = useState([]);
  const [userRating, setUserRating] = useState(0);
  const [userComment, setUserComment] = useState("");

  const fetchReviews = async (productId) => {
    const q = query(
      collection(db, "products", productId, "reviews"),
      orderBy("createdAt", "desc")
    );
    const snap = await getDocs(q);
    setReviews(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  };

  const handleSubmitReview = async () => {
    const user = auth.currentUser;
    if (!user) return toast.info("Please login to leave a review");
    if (userRating < 1) return toast.info("Please select a rating");

    const reviewRef = doc(collection(db, "products", id, "reviews"));
    await setDoc(reviewRef, {
      userId: user.uid,
      userName: user.displayName || "Anonymous",
      rating: userRating,
      comment: userComment,
      createdAt: serverTimestamp(),
    });

    setUserRating(0);
    setUserComment("");
    toast.success("Review submitted!");
    setReviews((prev) => [
      { id: reviewRef.id, userId: user.uid, userName: user.displayName, rating: userRating, comment: userComment, createdAt: new Date() },
      ...prev,
    ]);
  };

  useEffect(() => {
    const fetchProductAndRelated = async () => {
      const docRef = doc(db, "products", id);
      const snap = await getDoc(docRef);
      if (!snap.exists()) return;
      const current = { id: snap.id, ...snap.data() };
      setProduct(current);

      setCustomForm({
        deliveryDate: "",
        deliveryTime: "",
        quantity: 1,
        size: "REGULAR",
        candles: "-",
        cardMessage: "",
      });

      if (!current.category) {
        setRelatedProducts([]);
        return;
      }

      const q = query(collection(db, "products"), where("category", "==", current.category), limit(10));
      const relSnap = await getDocs(q);
      const sameCategory = relSnap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((p) => p.id !== current.id)
        .slice(0, 3);
      setRelatedProducts(sameCategory);

      // Fetch reviews
      fetchReviews(current.id);
    };

    fetchProductAndRelated();
  }, [id]);

  if (!product) return <div className="text-center py-20">Loading...</div>;

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-fixed"
      style={{ backgroundImage: `url('/images/gingham_pattern_purple_bg.jpg')` }}
    >
      <ToastContainer position="top-right" autoClose={1500} hideProgressBar closeOnClick pauseOnHover={false} draggable={false} theme="light" />

      <div className="max-w-6xl mx-auto px-3 pt-28 md:pt-32 w-full">
        {/* TOP BAR */}
        <div className="bg-white border-2 border-black rounded-sm px-4 py-3 flex flex-col md:flex-row md:items-center gap-3 w-full">
          <p className="text-sm text-gray-700 md:flex-1 truncate">
            <Link to="/menu" className="hover:underline hover:text-black">Menu</Link>
            <span className="mx-1">{">"}</span>
            <Link to={`/menu?category=${encodeURIComponent(product.category || "")}`} className="hover:underline hover:text-black">
              {product.category || "category"}
            </Link>
            <span className="mx-1">{">"}</span>
            <span className="font-medium text-black">{product.name}</span>
          </p>

          <form onSubmit={handleSearchSubmit} className="relative w-full md:max-w-md">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search related..."
              className="w-full border border-black rounded-sm pl-10 pr-3 py-2 outline-none"
            />
          </form>
        </div>

        {/* MAIN CARD */}
        <div className="mt-3 bg-white border-[3px] border-black p-8 w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
            {/* LEFT IMAGE */}
            <div className="flex justify-center">
              <img src={product.image} alt={product.name} className="w-[280px] h-[280px] sm:w-[320px] sm:h-[320px] md:w-[360px] md:h-[360px] rounded-xl border border-gray-300 object-cover" />
            </div>

            {/* RIGHT INFO */}
            <div className="text-center md:text-left text-[#7B2220]">
              <h1 className="text-4xl font-extrabold">{product.name}</h1>
              <p className="text-sm mt-4 leading-relaxed max-w-md md:mx-0 mx-auto">{product.description || "No description available."}</p>
              <p className="text-sm font-bold text-right mt-2 max-w-md md:ml-0 mx-auto">₱{product.price}</p>

              {isCustomCakes && (
                <div className="mt-6 border border-black rounded-sm p-4 text-left text-black">
                  <p className="text-xs font-bold mb-2 text-[#7B2220]">Custom Cakes Details</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Delivery Date */}
                    <div className="sm:col-span-1">
                      <label className="block text-xs font-semibold mb-1">Select delivery date</label>
                      <input
                        type="date"
                        value={customForm.deliveryDate}
                        onChange={(e) => updateCustomForm({ deliveryDate: e.target.value })}
                        className="w-full border border-black rounded-sm px-3 py-2 outline-none"
                      />
                    </div>

                    {/* Quantity */}
                    <div className="sm:col-span-1">
                      <label className="block text-xs font-semibold mb-1">Quantity</label>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <div className="flex items-center gap-2">
                          <button type="button" onClick={decQty} className="w-full sm:w-10 h-10 border border-black rounded-sm font-bold">−</button>
                          <input
                            type="number"
                            min={1}
                            max={99}
                            value={customForm.quantity}
                            onChange={(e) => updateCustomForm({ quantity: Math.max(1, Math.min(99, Number(e.target.value || 1))) })}
                            className="w-full sm:w-20 text-center border border-black rounded-sm px-2 py-2 outline-none"
                          />
                          <button type="button" onClick={incQty} className="w-full sm:w-10 h-10 border border-black rounded-sm font-bold">+</button>
                        </div>
                      </div>
                    </div>

                    {/* Delivery Time */}
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold mb-2">Select delivery time</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                        {["11AM - 1PM", "1PM - 3PM", "3PM - 5PM", "5PM - 7PM"].map((t) => (
                          <button key={t} type="button" onClick={() => updateCustomForm({ deliveryTime: t })} className={`border border-black rounded-sm px-2 py-2 text-xs w-full ${customForm.deliveryTime === t ? "bg-black text-white" : ""}`}>{t}</button>
                        ))}
                      </div>
                    </div>

                    {/* Size */}
                    <div className="sm:col-span-1">
                      <label className="block text-xs font-semibold mb-1">Size</label>
                      <select
                        value={customForm.size}
                        onChange={(e) => updateCustomForm({ size: e.target.value })}
                        className="w-full border border-black rounded-sm px-3 py-2 outline-none"
                      >
                        <option value="REGULAR">REGULAR</option>
                        <option value="LARGE">LARGE</option>
                        <option value="XL">XL</option>
                      </select>
                    </div>

                    {/* Candles */}
                    <div className="sm:col-span-1">
                      <label className="block text-xs font-semibold mb-1">Candles (FOC)</label>
                      <select
                        value={customForm.candles}
                        onChange={(e) => updateCustomForm({ candles: e.target.value })}
                        className="w-full border border-black rounded-sm px-3 py-2 outline-none"
                      >
                        <option value="-">-</option>
                        <option value="0">0</option>
                        <option value="1">1</option>
                        <option value="5">5</option>
                        <option value="10">10</option>
                      </select>
                    </div>

                    {/* Card Message */}
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold mb-1">Card message (max 250 words)</label>
                      <textarea
                        value={customForm.cardMessage}
                        onChange={(e) => updateCustomForm({ cardMessage: e.target.value })}
                        rows={4}
                        className="w-full border border-black rounded-sm px-3 py-2 outline-none"
                        placeholder="Include recipient’s name..."
                      />
                    </div>

                    {/* Preset Buttons */}
                    <div className="sm:col-span-2">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {["Birthday", "Romance", "Anniversary", "Get well soon", "Apology"].map((p) => (
                          <button key={p} type="button" onClick={() => applyPreset(p)} className="border border-black rounded-sm px-2 py-2 text-xs w-full">{p}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* BUTTONS */}
              <div className="mt-6 grid grid-cols-2 gap-3 sm:flex sm:gap-3 sm:justify-center md:justify-start">
                <button onClick={() => addToWishlist(product)} className="w-full border border-[#7B2220] text-[#7B2220] py-3 rounded-lg hover:bg-[#7B2220]/5 text-sm font-medium">
                  Add to wishlist
                </button>

                <button onClick={handleOrderNow} className="w-full bg-[#7B2220] text-white py-3 rounded-lg hover:opacity-95 text-sm font-medium">
                  Order Now
                </button>
              </div>

              {/* RELATED */}
              <div className="mt-8">
                <p className="text-sm text-[#7B2220] text-center md:text-left mb-3">Related Products</p>
                <div className="flex items-center justify-center md:justify-start gap-6">
                  {filteredRelated.length ? (
                    filteredRelated.map((p) => (
                      <Link
                        key={p.id}
                        to={`/product/${p.id}`}
                        className="w-16 h-16 min-w-[64px] min-h-[64px] rounded-lg border border-gray-400 overflow-hidden bg-white cursor-pointer hover:scale-105 hover:border-[#7B2220] transition-all"
                        title={p.name}
                      >
                        <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                      </Link>
                    ))
                  ) : (
                    <p className="text-xs text-gray-500">No related products found.</p>
                  )}
                </div>
              </div>
            </div>

            {/* REVIEWS DISPLAY */}
            <div className="mt-6 border-t border-gray-200 pt-4">
              <h2 className="text-lg font-semibold mb-2">Customer Reviews</h2>
              {reviews.length === 0 && <p className="text-sm text-gray-500">No reviews yet.</p>}
              {reviews.map((r) => (
                <div key={r.id} className="border-b border-gray-200 py-3">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{r.userName}</p>
                    <div className="flex gap-1 text-yellow-400">
                      {Array.from({ length: 5 }).map((_, idx) => <span key={idx}>{idx < r.rating ? "★" : "☆"}</span>)}
                    </div>
                  </div>
                  {r.comment && <p className="text-sm text-gray-700 mt-1">{r.comment}</p>}
                  <p className="text-xs text-gray-400">{r.createdAt?.toDate ? r.createdAt.toDate().toLocaleString() : ""}</p>
                </div>
              ))}
            </div>

            {/* REVIEWS SUBMISSION */}
            <div className="mt-6 border-t border-gray-300 pt-4">
              <h2 className="text-lg font-semibold mb-2">Leave a Review</h2>
              <div className="flex items-center gap-1 mt-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setUserRating(i)}
                    className={`text-2xl ${i <= userRating ? "text-yellow-400" : "text-gray-300"} hover:text-yellow-400 transition-colors`}
                  >
                    ★
                  </button>
                ))}
              </div>
              <textarea
                value={userComment}
                onChange={(e) => setUserComment(e.target.value)}
                placeholder="Write a review..."
                className="w-full border border-gray-300 rounded-sm px-3 py-2 mt-2 outline-none"
              />
              <button
                onClick={handleSubmitReview}
                className="mt-2 bg-[#7B2220] text-white px-4 py-2 rounded hover:opacity-90"
              >
                Submit Review
              </button>
            </div>
          </div>
        </div>

        <div className="h-6" />
      </div>
    </div>
  );
}
