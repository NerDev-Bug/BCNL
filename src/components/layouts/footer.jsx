function FooterNavbar() {
  return (
    <footer className="bg-white border-t border-gray-300">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* TOP CONTENT */}
        <div className="flex flex-col md:flex-row gap-10 md:gap-16">
          {/* LEFT SECTIONS */}
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-10">
            {/* SECTION 1 */}
<div className="flex items-center">
  <img
    src="/images/bcnl_logo.png"
    alt="Bake Corner NL Logo"
    className="h-20 w-auto"
  />
</div>
            {/* SECTION 2 */}
            <div>
              <h1 className="text-sm font-bold tracking-wide mb-4 uppercase">
                Information
              </h1>
              <div className="text-sm space-y-2 text-gray-700">
                <p>Terms and conditions</p>
                <p>Privacy Policy</p>
                <p>Careers</p>
              </div>
            </div>

            {/* SECTION 3 */}
            <div>
              <h1 className="text-sm font-bold tracking-wide mb-4 uppercase">
                Get in touch
              </h1>
              <div className="text-sm space-y-2 text-gray-700">
                <p>bcnl2026@gmail.com</p>
                <p>(31+)2012345678</p>
              </div>
            </div>
          </div>

          {/* VERTICAL DIVIDER (DESKTOP ONLY) */}
          <div className="hidden md:block w-px bg-gray-400" />

          {/* RIGHT SECTION */}
          <div className="w-full md:w-[360px]">
            <h1 className="text-sm font-bold uppercase mb-6">
              Subscribe to our newsletter to receive our offers!
            </h1>

            {/* INPUT */}
            <div className="flex items-center bg-gray-200 rounded-md px-3 py-2">
              <input
                type="email"
                placeholder="Your email address"
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
  {/* Facebook */}
  <div className="relative w-7 h-7 cursor-pointer group">
    <img
      src="./images/black_fb.png"
      alt="Facebook"
      className="absolute inset-0 w-full h-full group-hover:opacity-0 transition-opacity duration-200"
    />
    <img
      src="./images/color_fb.png"
      alt="Facebook"
      className="absolute inset-0 w-full h-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
    />
  </div>

  {/* Instagram */}
  <div className="relative w-7 h-7 cursor-pointer group">
    <img
      src="./images/black_ig.png"
      alt="Instagram"
      className="absolute inset-0 w-full h-full group-hover:opacity-0 transition-opacity duration-200"
    />
    <img
      src="./images/color_ig.png"
      alt="Instagram"
      className="absolute inset-0 w-full h-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
    />
  </div>

  {/* TikTok */}
  <div className="relative w-7 h-7 cursor-pointer group">
    <img
      src="./images/black_tiktok.png"
      alt="TikTok"
      className="absolute inset-0 w-full h-full group-hover:opacity-0 transition-opacity duration-200"
    />
    <img
      src="./images/color_tiktok.png"
      alt="TikTok"
      className="absolute inset-0 w-full h-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
    />
  </div>
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
