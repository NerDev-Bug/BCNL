import { Link } from "react-router-dom"
import { useEffect, useState } from "react"
import { db } from "../firebase"
import { doc, getDoc } from "firebase/firestore"

import Favorites from "../components/home/favorites"
import OurStory from "../components/home/ourstory"
import useScrollToHash from "../hooks/useScrollToHash"
import Events from "../components/home/events"
import PickUp from "../components/home/pickUp"
import CongratsModal from "../components/common/CongratsModal"

const DEFAULT_HOME = {
  heading: "Small Batch Artisan Bakery in Wageningen",
  subheading: "Freshly baked cakes, pastries, and sweets",

  // ✅ Next Bake Day (admin-controlled fields)
  nextBakeDate: "", // "2026-04-26"
  nextBakeSlotsText: "limited slots",
  nextBakeTitle: "Next Bake Day",

  // ✅ Buttons
  menuLink: "/menu",
  preorderLink: "/menu",
  comingSoonLink: "/events",

  // ✅ Images
  bgImage: "./images/purple_Bg.png",
  cakeImage: "./images/Cakehome.png",
  showHeroImageOnMobile: false,
}

function Home() {
  useScrollToHash()

  const [homeContent, setHomeContent] = useState(DEFAULT_HOME)

  useEffect(() => {
    const load = async () => {
      try {
        const snap = await getDoc(doc(db, "pages", "home"))
        if (snap.exists()) {
          setHomeContent({ ...DEFAULT_HOME, ...snap.data() })
        }
      } catch (e) {
        console.error("Failed to load home content:", e)
      }
    }
    load()
  }, [])

  const formattedBakeDate = homeContent.nextBakeDate
    ? new Date(homeContent.nextBakeDate).toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
      })
    : ""

  return (
    <>
      {/* Hero Section */}
      <section
        className="
          relative max-w-screen-2xl mx-auto overflow-hidden
          pt-28 md:pt-0
        "
      >
        <div className="w-full">
          <div className="flex flex-col md:flex-row">
            {/* ✅ RIGHT TEXT SIDE */}
            <div className="flex flex-1 items-start md:items-center justify-center px-6 md:px-12 order-1 md:order-2">
              {/* ✅ CENTER EVERYTHING */}
              <div className="max-w-xl text-center mx-auto flex flex-col items-center py-10 md:py-0">
                {/* TITLE */}
                <h1 className="text-4xl md:text-5xl font-cooper text-[#502455] leading-tight font-semibold">
                  {homeContent.heading}
                </h1>

                <p className="mt-4 text-lg text-gray-700">
                  {homeContent.subheading}
                </p>

                {/* ✅ NEXT BAKE DAY (CENTERED) */}
                {homeContent.nextBakeDate && (
                  <div className="mt-6 bg-[#FFF2C6] text-[#5B1E5D] px-6 py-4 rounded-xl font-medium text-center w-full max-w-md">
                    <span className="font-semibold">
                      {homeContent.nextBakeTitle || "Next Bake Day"}:{" "}
                      <strong>{formattedBakeDate}</strong>
                    </span>

                    {!!homeContent.nextBakeSlotsText && (
                      <div className="text-sm opacity-80 mt-1">
                        ({homeContent.nextBakeSlotsText})
                      </div>
                    )}
                  </div>
                )}

                {/* ✅ BUTTONS (CENTERED + SAME WIDTH) */}
                <div className="mt-8 flex flex-col gap-4 w-full max-w-md">
                  <Link
                    to={homeContent.menuLink || "/menu"}
                    className="w-full flex items-center justify-center gap-2 bg-[#FFE4A3] text-[#5B1E5D] font-semibold px-6 py-4 rounded-xl hover:opacity-90 transition"
                  >
                    🍰 See Today&apos;s Menu →
                  </Link>

                  <Link
                    to={homeContent.preorderLink || "/menu"}
                    className="w-full flex items-center justify-center gap-2 bg-[#5B1E5D] text-white font-semibold px-6 py-4 rounded-xl hover:opacity-90 transition"
                  >
                    🛍 Pre-Order for Pickup →
                  </Link>

                  <Link
  to="/events"
  className="w-full flex items-center justify-center gap-2 border border-[#5B1E5D] text-[#5B1E5D] font-semibold px-6 py-4 rounded-xl hover:bg-[#5B1E5D]/10 transition"
>
  → See What&apos;s Coming Soon
</Link>
                </div>
              </div>
            </div>

            {/* ✅ LEFT IMAGE SIDE */}
            <div
              className={[
                "relative h-screen -ml-20 order-2 md:order-1",
                homeContent.showHeroImageOnMobile ? "flex" : "hidden",
                "md:flex",
              ].join(" ")}
            >
              <img
                src={homeContent.bgImage}
                className="w-full h-full object-cover"
                alt="Background"
              />

              <img
                src={homeContent.cakeImage}
                alt="Cake"
                className="absolute top-1/2 left-1/2 w-[280px] md:w-[420px] -translate-x-1/2 -translate-y-1/2 pointer-events-none"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Pick-Up Orders Section */}
      <section>
        <PickUp />
      </section>

      {/* Events Section */}
      <section>
        <Events />
      </section>

      {/* Favorites Section */}
      <section>
        <Favorites />
      </section>

      {/* Our Story Section */}
      <section id="our-story">
        <OurStory />
      </section>

      {/* Congrats Modal for Reward Points */}
      <CongratsModal />
    </>
  )
}

export default Home
