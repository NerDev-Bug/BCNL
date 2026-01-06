function FooterNavbar() {
  return (
    <nav className="footer-navbar">
      <div className="flex justify-center items-center p-4 pt-6">
        <div className="flex flex-col md:flex-row gap-0 md:gap-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-2">
                {/* Section 1 */}
                <div className="w-auto h-auto px-2">
                    <div>
                        <h1 className="text-xl font-bold">Bake Corner NL</h1>
                        <div className="text-md m-6 space-y-1">
                            <p>+2(123)-456-789-1</p>
                            <p>info@lorem.ipsum</p>
                            <p>Lorem Ipsum is simply</p>
                            <p>dummy</p>
                        </div>
                    </div>
                </div>
                {/* Section 2 */}
                <div className="w-auto h-auto px-2">
                    <div>
                        <h1 className="text-lg">Exporting</h1>
                        <div className="text-md mt-6 space-y-1">
                            <p>For</p>
                            <p>Interfacing</p>
                            <p>Reality</p>
                            <p>Basic Know</p>
                        </div>
                    </div>
                </div>
                {/* Section 3 */}
                <div className="w-auto h-auto px-2">
                    <div>
                        <h1 className="text-lg">Transforming</h1>
                        <div className="text-md mt-6 space-y-1">
                            <p>Home</p>
                            <p>Order</p>
                            <p>Menu</p>
                            <p>Our Story</p>
                        </div>
                    </div>
                </div>
            </div>
            <div className="h-60 w-0.5 bg-gray-400"></div>
            {/* Section 4 */}
            <div className="w-80 h-auto px-4 md:ml-4">
                <div className="flex flex-col">
                    <h1 className="text-lg">Lorem Ipsum is simply dummy text of lorm ips</h1>
                    <div className="text-md mt-6">
                        <div className="flex items-center bg-[#D9D9D9] rounded-md px-2 py-1 w-full">
                            <input
                                type="email"
                                placeholder="Lorem Ipsum is simply"
                                className="flex-1 bg-transparent outline-none text-gray-700 placeholder-gray-400"
                            />
                            <button
                                aria-label="subscribe"
                                className="ml-3 bg-[#4F5C39] text-white rounded-full p-2 w-8 h-8 flex items-center justify-center hover:bg-[#363F29]"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>
                    </div>
                    <div>
                        <div className="flex space-x-4 mt-6 ml-4">
                            <img src="./images/Facebook-Icon.png" alt="Facebook" className="w-3 h-4 cursor-pointer" />
                            <img src="./images/Twitter-Icon.png" alt="Twitter" className="w-4 h-4 cursor-pointer" />
                            <img src="./images/Instagram-Icon.png" alt="Instagram" className="w-4 h-4 cursor-pointer" />
                            <img src="./images/Youtube-Icon.png" alt="YouTube" className="w-6 h-4 cursor-pointer" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
        <div className="max-w-6xl mx-auto px-4 flex justify-end text-sm text-black">
                <p>© 2025 Bake Corner NL.</p>
        </div>
        <div className="w-full border-t border-gray-300 mt-4 pt-4"></div>
    </nav>
  );
}
export default FooterNavbar;