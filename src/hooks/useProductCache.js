// common/useProductCache.js
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

const productCache = {};

export async function getProduct(productId) {
  if (productCache[productId]) {
    return productCache[productId];
  }

  const ref = doc(db, "products", productId);
  const snap = await getDoc(ref);

  if (!snap.exists()) return null;

  const data = snap.data();
  productCache[productId] = data;
  return data;
}
