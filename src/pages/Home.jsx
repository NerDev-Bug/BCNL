import { Link } from "react-router-dom";
import Favorites from "../components/home/favorites";
import OurStory from "../components/home/ourstory";
import useScrollToHash from "../hooks/useScrollToHash";

function Home() {
  useScrollToHash();
  return (
    <>
        {/* Hero Section */}
        <section className="relative min-h-screen overflow-hidden">
          <div className="w-full">
              <div className="flex flex-col md:flex-row">
                  <div className="flex h-screen -ml-20">
                      <img src="./images/bgxcake_purple.png" className="w-full h-full" />
                  </div>
                  <div className="flex items-center justify-center bg-white flex-1 p-10 md:p-0">
                    <div className="pl-5 max-w-6xl">
                      <p className="text-4xl md:text-6xl text-[#502455] leading-tight font-semibold font-cooper mr-20">Homemade cakes and pastries <span className="text-base align-bottom font-normal">est. 2019</span></p>

                      <p className="mt-6 ml-12 text-xl text-gray-700">Home of the first Ube Flan Cake in Wageningen</p>

                      <div className="mt-8 flex justify-center items-center space-x-4 px-4 py-4">
                        <button className="px-6 py-3 rounded-md border border-[#7B2220] text-[#7B2220] bg-white">Contact us</button>
                        <Link to="/menu" className="px-6 py-3 rounded-md bg-[#7B2220] text-white">Order Now</Link>
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
