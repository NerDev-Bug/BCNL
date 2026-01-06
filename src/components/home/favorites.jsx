function Favorites() {
    return (
        <div className="bg-cover bg-center" style={{ backgroundImage: `url('/images/gingham_pattern_purple_bg.jpg')` }}>
            <div className="py-8 px-4 max-w-6xl mx-auto relative">
                <h1 className="text-4xl font-bold text-[#502455] font-cooper text-center">Favorites</h1>

                <button className="absolute left-6 top-8 bg-[#7a2d2d] text-white rounded-md px-4 py-2 text-sm flex items-center gap-2 hover:opacity-90">
                    Go to Menu
                    <span className="ml-1 bg-[#7a2d2d] rounded-sm w-6 h-6 flex items-center justify-center shadow-sm">
                        <img src="./images/Farword-Arrow.png" alt="" className="w-4 h-3" />
                    </span>
                </button>

                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[{
                        title: 'Chocolate Cake',
                        price: '₱550',
                        img: './images/chocolate_cake.jpg'
                    },{
                        title: 'Ube - White Chocolate cookies',
                        price: '₱550',
                        img: './images/ube-white_chocolate_cookies.jpg'
                    },{
                        title: 'Silvanas',
                        price: '₱550',
                        img: './images/silvanas.jpg'
                    }].map((p, idx) => (
                        <div key={idx} className="group relative bg-white border border-[#7B2220] rounded-md shadow-md overflow-hidden flex flex-col">
                            <div className="p-4">
                                <div className="relative border border-gray-200 rounded-md overflow-hidden">
                                    <img src={p.img} alt={p.title} className="w-full h-80 object-cover" />
                                    <button aria-label="add-to-wishlist" className="absolute top-3 right-3 bg-white rounded-full w-9 h-9 flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6 text-gray-700">
                                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 6 4 4 6.5 4c1.54 0 3.04.99 3.57 2.36h.87C13.46 4.99 14.96 4 16.5 4 19 4 21 6 21 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                            <div className="px-6 pb-6 flex-1 flex flex-col justify-between">
                                <div>
                                    <h3 className="text-center text-lg font-semibold text-[#7B2220]">{p.title}</h3>
                                    <p className="text-center text-sm text-[#7B2220] font-semibold mt-2">{p.price}</p>
                                </div>
                                <div className="mt-4 flex justify-center gap-4">
                                    <button className="border border-[#7B2220] text-[#7a2d2d] rounded-md px-3 py-2 text-sm hover:bg-gray-50">Add to Wishlist</button>
                                    <button className="border border-[#7B2220] bg-white text-[#7a2d2d] rounded-md px-3 py-2 text-sm hover:bg-gray-50">Order Now</button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default Favorites