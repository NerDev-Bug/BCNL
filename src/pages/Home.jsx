import { Link } from "react-router-dom"
import Favorites from "../components/home/favorites"
import OurStory from "../components/home/ourstory"
import useScrollToHash from "../hooks/useScrollToHash"

function Home() {
  useScrollToHash()

  return (
    <>
      {/* Hero Section */}
      <section className="relative max-w-screen-2xl mx-auto min-h-screen overflow-hidden">
        <div className="w-full">
          {/* ✅ mobile: column (text on top), md+: row */}
          <div className="flex flex-col md:flex-row">
            {/* ✅ RIGHT TEXT SIDE (put first so it's on top on mobile) */}
            <div className="flex flex-1 items-center justify-center px-6 md:px-12 order-1 md:order-2 min-h-screen md:min-h-0">
              <div className="max-w-xl text-center mx-auto">
                <p className="text-4xl md:text-6xl text-[#502455] leading-tight font-semibold font-cooper">
                  Homemade cakes and pastries{" "}
                  <span className="text-base align-bottom font-normal">
                    est. 2019
                  </span>
                </p>

                <p className="mt-6 text-xl text-gray-700">
                  Home of the first Ube Flan Cake in Wageningen
                </p>

                <div className="mt-8 flex justify-center items-center space-x-4 px-4 py-4">
                  <button
                    className="px-6 py-3 rounded-md border border-[#7B2220] text-[#7B2220] bg-white"
                    onClick={() => window.open("https://wa.me/639105171791?text=Hi%20I%20need%20help", "_blank")}
                  >
                    Contact us
                  </button>
                  <Link
                    to="/menu"
                    className="px-6 py-3 rounded-md bg-[#7B2220] text-white"
                  >
                    Order Now
                  </Link>
                </div>
              </div>
            </div>
            {/* ✅ LEFT IMAGE SIDE (hide on phone) */}
            <div className="relative h-screen -ml-20 hidden md:flex order-2 md:order-1">
              {/* Background */}
              <img
                src="./images/purple_Bg.png"
                className="w-full h-full object-cover"
                alt="Background"
              />

              {/* Overlay spinning cake */}
              <img
                src="./images/Cakehome.png"
                alt="Cake"
                className="absolute top-1/2 left-1/2 w-[280px] md:w-[420px] -translate-x-1/2 -translate-y-1/2 pointer-events-none"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Favorites Section */}
      <section>
        <Favorites />
      </section>

      {/* Our Story Section / Scroll Target */}
      <section id="our-story">
        <OurStory />
      </section>
    </>
  )
}

export default Home
