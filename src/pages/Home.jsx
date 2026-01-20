import { Link } from "react-router-dom";
import Favorites from "../components/home/favorites";
import OurStory from "../components/home/ourstory";
import useScrollToHash from "../hooks/useScrollToHash";

function Home() {
  useScrollToHash();

  return (
    <>
      {/* Hero Section */}
      <section className="relative max-w-screen-2xl mx-auto mx-auto min-h-screen overflow-hidden">
        <div className="w-full">
          <div className="flex flex-col md:flex-row">
            {/* LEFT IMAGE SIDE */}
            <div className="relative flex h-screen -ml-20">
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
                className="absolute top-1/2 left-1/2 w-[280px] md:w-[420px] -translate-x-1/2 -translate-y-1/2 animate-spinSlow pointer-events-none"
              />
            </div>

            {/* RIGHT TEXT SIDE */}
            <div className="flex items-center justify-center bg-white md:w-1/2 flex-1 px-6 md:px-12">
              <div className="max-w-xl">
                <p className="text-4xl md:text-6xl text-[#502455] leading-tight font-semibold font-cooper">
                  Homemade cakes and pastries{" "}
                  <span className="text-base align-bottom font-normal">
                    est. 2019
                  </span>
                </p>

                <p className="mt-6 ml-12 text-xl text-gray-700">
                  Home of the first Ube Flan Cake in Wageningen
                </p>

                <div className="mt-8 flex justify-center items-center space-x-4 px-4 py-4">
                  <button className="px-6 py-3 rounded-md border border-[#7B2220] text-[#7B2220] bg-white">
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
  );
}

export default Home;
