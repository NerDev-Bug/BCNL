import { Link } from "react-router-dom"
import { useEffect, useState } from "react"
import { db } from "../firebase"
import { doc, getDoc } from "firebase/firestore"

import Favorites from "../components/home/favorites"
import OurStory from "../components/home/ourstory"
import useScrollToHash from "../hooks/useScrollToHash"
import Events from "../components/home/events"

const DEFAULT_HOME = {
  heading: "Homemade cakes and pastries",
  estText: "est. 2019",
  subheading: "Home of the first Ube Flan Cake in Wageningen",
  primaryBtnText: "Order Now",
  primaryBtnLink: "/menu",
  secondaryBtnText: "Contact us",
  whatsappLink: "https://wa.me/639105171791?text=Hi%20I%20need%20help",
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

  return (
    <>
      {/* Hero Section */}
      <section className="relative max-w-screen-2xl mx-auto min-h-screen overflow-hidden">
        <div className="w-full">
          <div className="flex flex-col md:flex-row">
            {/* ✅ RIGHT TEXT SIDE */}
            <div className="flex flex-1 items-center justify-center px-6 md:px-12 order-1 md:order-2 min-h-screen md:min-h-0">
              <div className="max-w-xl text-center mx-auto">
                <p className="text-4xl md:text-6xl text-[#502455] leading-tight font-semibold font-cooper">
                  {homeContent.heading}{" "}
                  <span className="text-base align-bottom font-normal">
                    {homeContent.estText}
                  </span>
                </p>

                <p className="mt-6 text-xl text-gray-700">
                  {homeContent.subheading}
                </p>

                <div className="mt-8 flex justify-center items-center space-x-4 px-4 py-4">
                  <button
                    className="px-6 py-3 rounded-md border border-[#7B2220] text-[#7B2220] bg-white"
                    onClick={() =>
                      window.open(homeContent.whatsappLink, "_blank")
                    }
                  >
                    {homeContent.secondaryBtnText}
                  </button>

                  {homeContent.primaryBtnLink?.startsWith("http") ? (
                    <a
                      href={homeContent.primaryBtnLink}
                      target="_blank"
                      rel="noreferrer"
                      className="px-6 py-3 rounded-md bg-[#7B2220] text-white"
                    >
                      {homeContent.primaryBtnText}
                    </a>
                  ) : (
                    <Link
                      to={homeContent.primaryBtnLink || "/menu"}
                      className="px-6 py-3 rounded-md bg-[#7B2220] text-white"
                    >
                      {homeContent.primaryBtnText}
                    </Link>
                  )}
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

      <section>
        <Events />
      </section>

      <section>
        <Favorites />
      </section>

      <section id="our-story">
        <OurStory />
      </section>
    </>
  )
}

export default Home
