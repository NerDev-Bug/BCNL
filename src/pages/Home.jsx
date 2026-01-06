import Favorites from "../components/home/favorites";
import OurStory from "../components/home/ourstory";

function Home() {
  return (
    <>
        <section className="relative min-h-screen overflow-hidden">
          <div className="w-full px-2">
              <div className="flex flex-col md:flex-row">
                  <div className="flex h-screen -ml-20">
                      <img src="./images/bgxcake_purple.png" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex items-center justify-center bg-white flex-1">
                    <div className="pl-5 max-w-6xl">
                      <p className="text-6xl md:text-6xl text-[#502455] leading-tight font-semibold font-cooper mr-20">Homemade cakes and pastries <span className="text-base align-bottom font-normal">est. 2019</span></p>

                      <p className="mt-6 ml-12 text-xl text-gray-700">Home of the first Ube Flan Cake in Wageningen</p>

                      <div className="mt-8 flex justify-center items-center space-x-4">
                        <button className="px-6 py-3 rounded-md border border-[#7B2220] text-[#7B2220] bg-white">Contact us</button>
                        <button className="px-6 py-3 rounded-md bg-[#7B2220] text-white">Order Now</button>
                      </div>
                    </div>
                  </div>
              </div>
          </div>
      </section>
      <Favorites />
      <OurStory />
    </>
  );
}

export default Home;
