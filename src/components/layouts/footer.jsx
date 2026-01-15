function FooterNavbar() {
  return (
    <footer className="bg-white border-t border-gray-300">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* TOP CONTENT */}
        <div className="flex flex-col md:flex-row gap-10 md:gap-16">
          {/* LEFT SECTIONS */}
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-10">
            {/* SECTION 1 */}
            <div>
              <h1 className="text-xl font-bold mb-4">Bake Corner NL</h1>
              <div className="text-sm space-y-2 text-gray-700">
                <p>+2 (123) 456 7891</p>
                <p>info@lorem.ipsum</p>
                <p>Lorem Ipsum is simply</p>
                <p>dummy</p>
              </div>
            </div>

            {/* SECTION 2 */}
            <div>
              <h1 className="text-sm font-bold tracking-wide mb-4 uppercase">
                Exporting
              </h1>
              <div className="text-sm space-y-2 text-gray-700">
                <p>For</p>
                <p>Interfacing</p>
                <p>Reality</p>
                <p>Basic Know</p>
              </div>
            </div>

            {/* SECTION 3 */}
            <div>
              <h1 className="text-sm font-bold tracking-wide mb-4 uppercase">
                Transforming
              </h1>
              <div className="text-sm space-y-2 text-gray-700">
                <p>Home</p>
                <p>Our Story</p>
                <p>Menu</p>
                <p>Orders</p>
              </div>
            </div>
          </div>

          {/* VERTICAL DIVIDER (DESKTOP ONLY) */}
          <div className="hidden md:block w-px bg-gray-400" />

          {/* RIGHT SECTION */}
          <div className="w-full md:w-[360px]">
            <h1 className="text-sm font-bold uppercase mb-6">
              Lorem Ipsum is simply dummy <br />
              text of lorm ips
            </h1>

            {/* INPUT */}
            <div className="flex items-center bg-gray-200 rounded-md px-3 py-2">
              <input
                type="email"
                placeholder="Lorem Ipsum is simply"
                className="flex-1 bg-transparent outline-none text-sm text-gray-600 placeholder-gray-500"
              />
              <button
                aria-label="subscribe"
                className="ml-3 bg-[#4F5C39] text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-[#363F29]"
              >
                →
              </button>
            </div>

            {/* SOCIAL ICONS */}
            <div className="flex gap-6 mt-6 items-center">
              <img src="./images/Facebook-Icon.png" alt="Facebook" className="w-4 h-4 cursor-pointer" />
              <img src="./images/Twitter-Icon.png" alt="Twitter" className="w-4 h-4 cursor-pointer" />
              <img src="./images/Instagram-Icon.png" alt="Instagram" className="w-4 h-4 cursor-pointer" />
              <img src="./images/Youtube-Icon.png" alt="YouTube" className="w-6 h-4 cursor-pointer" />
            </div>
          </div>
        </div>

        {/* BOTTOM */}
        <div className="border-t border-gray-300 mt-12 pt-4 flex justify-center md:justify-end text-sm text-gray-700">
          © 2025 Bake Corner NL.
        </div>
      </div>
    </footer>
  )
}

export default FooterNavbar
