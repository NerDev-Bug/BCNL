import { useEffect, useMemo, useState } from "react"
import { onAuthStateChanged } from "firebase/auth"
import { auth } from "../../firebase" // adjust path if needed

function DeliveryLayout() {
  const [user, setUser] = useState(null)

  // ✅ Detect login / logout realtime
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u || null))
    return () => unsub()
  }, [])

  // ✅ Messages change depending on login
  const messages = useMemo(() => {
    if (user) {
      return [
        "Welcome back! You can now earn points on every order 🎉",
        "Check your account for discounts & rewards 💸",
        "Tip: Add items to cart early to avoid sold out ✅",
      ]
    }

    return [
      "Create an account and earn points on every order 🎁",
      "Sign up today to unlock member discounts 💸",
      "Fast checkout + order tracking when you register ✅",
    ]
  }, [user])

  // ✅ repeat messages to make ticker seamless
  const loopMessages = [...messages, ...messages, ...messages]

  return (
    <div className="w-full p-2 bg-black overflow-hidden">
      <div className="flex items-center text-white whitespace-nowrap">
        {/* ✅ moving row */}
        <div className="flex items-center animate-marquee">
          {loopMessages.map((msg, idx) => (
            <div key={idx} className="flex items-center">
              <img
                src="./images/Backword-Arrow.png"
                alt=""
                className="w-6 h-4 mx-4 shrink-0"
              />
              <img
                src="./images/truck.png"
                alt="truck"
                className="w-6 h-4 mx-4 shrink-0"
              />

              <p className="mx-4 text-sm">{msg}</p>

              <img
                src="./images/Farword-Arrow.png"
                alt=""
                className="w-6 h-4 mx-4 shrink-0"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default DeliveryLayout
