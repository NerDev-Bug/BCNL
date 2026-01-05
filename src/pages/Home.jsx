import Favorites from "../components/home/favorites";

function Home() {
  return (
    <>
        <section className="relative min-h-screen flex items-center overflow-hidden">
          <div className="max-w-9xl mx-auto w-full px-2">
              <div className="flex flex-col md:flex-row justify-center items-center">
                  <div className="flex items-center justify-center h-screen">
                      <h1 className="text-2xl font-bold text-purple-600">Home</h1>
                  </div>
              </div>
          </div>
      </section>
      <Favorites />
    </>
  );
}

export default Home;
