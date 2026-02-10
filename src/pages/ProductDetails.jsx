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
import StarRating from "../components/common/StarRating";

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
    try {
      const q = query(
        collection(db, "products", productId, "reviews"),
        orderBy("createdAt", "desc")
      );
      const snap = await getDocs(q);
      const reviewsData = snap.docs.map((d) => {
        const data = d.data();
        let createdAt = new Date();
        if (data.createdAt?.toDate) {
          createdAt = data.createdAt.toDate();
        } else if (data.createdAt?.seconds) {
          createdAt = new Date(data.createdAt.seconds * 1000);
        }
        return {
          id: d.id,
          ...data,
          createdAt,
        };
      });
      setReviews(reviewsData);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      toast.error("Failed to load reviews");
    }
  };

  // Calculate average rating from reviews
  const averageRating = useMemo(() => {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, review) => acc + (review.rating || 0), 0);
    return sum / reviews.length;
  }, [reviews]);

  const handleSubmitReview = async () => {
    const user = auth.currentUser;
    if (!user) {
      toast.info("Please login to leave a review");
      window.openLoginModal?.();
      return;
    }
    
    if (userRating < 1) {
      toast.info("Please select a rating ⭐");
      return;
    }

    if (!userComment.trim()) {
      toast.info("Please write a review comment");
      return;
    }

    try {
      const reviewRef = doc(collection(db, "products", id, "reviews"));
      await setDoc(reviewRef, {
        userId: user.uid,
        userName: user.displayName || user.email?.split("@")[0] || "Anonymous",
        userEmail: user.email || null,
        rating: userRating,
        comment: userComment.trim(),
        createdAt: serverTimestamp(),
      });

      setUserRating(0);
      setUserComment("");
      toast.success("Review submitted successfully! ⭐");
      
      // Refresh reviews from Firestore
      await fetchReviews(id);
    } catch (error) {
      console.error("Error submitting review:", error);
      toast.error("Failed to submit review. Please try again.");
    }
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
              
              {/* Average Rating Display */}
              <div className="flex items-center justify-center md:justify-start gap-2 mt-2">
                <StarRating rating={averageRating} interactive={false} size="md" color="primary" />
                {reviews.length > 0 && (
                  <span className="text-md text-gray-600">
                    ({averageRating.toFixed(1)}) • {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
                  </span>
                )}
                {reviews.length === 0 && (
                  <span className="text-md text-gray-500">No reviews yet</span>
                )}
              </div>

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

            {/* REVIEWS SECTION */}
            <div className="md:col-span-2 mt-8 border-t-2 border-gray-300 pt-6">
              <h2 className="text-2xl font-bold text-[#7B2220] mb-6">Customer Reviews</h2>
              
              {/* REVIEWS DISPLAY */}
              <div className="space-y-4 mb-8">
                {reviews.length === 0 ? (
                  <div className="text-center py-8 border border-gray-200 rounded-lg bg-gray-50">
                    <p className="text-gray-500">No reviews yet. Be the first to review this product!</p>
                  </div>
                ) : (
                  reviews.map((r) => (
                    <div key={r.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#7B2220] flex items-center justify-center text-white font-semibold">
                            {(r.userName || "A")[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-[#7B2220]">{r.userName || "Anonymous"}</p>
                            <StarRating rating={r.rating || 0} interactive={false} size="sm" color="primary" />
                          </div>
                        </div>
                        <p className="text-xs text-gray-500">
                          {r.createdAt instanceof Date 
                            ? r.createdAt.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
                            : new Date(r.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
                          }
                        </p>
                      </div>
                      {r.comment && (
                        <p className="text-sm text-gray-700 mt-2 leading-relaxed">{r.comment}</p>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* REVIEWS SUBMISSION */}
              <div className="bg-white border-2 border-[#7B2220] rounded-lg p-6">
                <h3 className="text-xl font-semibold text-[#7B2220] mb-4">Write a Review</h3>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Your Rating</label>
                  <StarRating 
                    rating={userRating} 
                    onRatingChange={setUserRating}
                    interactive={true}
                    size="lg"
                    color="primary"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Your Review</label>
                  <textarea
                    value={userComment}
                    onChange={(e) => setUserComment(e.target.value)}
                    placeholder="Share your experience with this product..."
                    rows={4}
                    className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 outline-none focus:border-[#7B2220] transition-colors resize-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">{userComment.length} characters</p>
                </div>

                <button
                  onClick={handleSubmitReview}
                  disabled={userRating === 0 || !userComment.trim()}
                  className="w-full bg-[#7B2220] text-white px-6 py-3 rounded-lg hover:bg-[#502455] transition-colors font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed disabled:text-gray-500"
                >
                  Submit Review
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="h-6" />
      </div>
    </div>
  );
}
