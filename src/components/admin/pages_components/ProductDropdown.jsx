import { useState, useRef, useEffect } from "react"

export default function ProductDropdown({
  label,
  value,
  options,
  onChange,
  disabled = false,
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const dropdownRef = useRef(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
        setSearchQuery("")
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const selectedOption = options.find((opt) => opt.id === value)

  const filteredOptions = options.filter((opt) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    const name = (opt.name || "").toLowerCase()
    const category = (opt.category || "").toLowerCase()
    const price = String(opt.price || "")
    return name.includes(query) || category.includes(query) || price.includes(query)
  })

  const handleSelect = (productId) => {
    onChange(productId)
    setIsOpen(false)
    setSearchQuery("")
  }

  return (
    <div className="space-y-2" ref={dropdownRef}>
      <label className="block text-sm font-semibold text-gray-700">
        {label}
      </label>

      {/* Custom Dropdown Button */}
      <div className="relative">
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={`
            w-full flex items-center justify-between gap-3 px-4 py-3 
            border-2 rounded-xl transition-all duration-200
            ${disabled
              ? "bg-gray-100 border-gray-200 cursor-not-allowed"
              : isOpen
              ? "border-[#7B2220] bg-white shadow-lg ring-2 ring-[#7B2220]/20"
              : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-md"
            }
          `}
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {selectedOption ? (
              <>
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-[#7B2220]/10 to-[#502455]/10 flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-[#7B2220]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                    />
                  </svg>
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {selectedOption.name || "Unnamed Product"}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {selectedOption.price != null && (
                      <span className="text-xs font-semibold text-[#7B2220]">
                        €{selectedOption.price}
                      </span>
                    )}
                    {selectedOption.category && (
                      <span className="text-xs text-gray-500">
                        • {selectedOption.category}
                      </span>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <span className="text-sm text-gray-400">Select product...</span>
            )}
          </div>
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform duration-200 flex-shrink-0 ${
              isOpen ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute z-50 w-full mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-2xl max-h-96 overflow-hidden flex flex-col">
            {/* Search Input */}
            <div className="p-3 border-b border-gray-200 bg-gray-50">
              <div className="relative">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7B2220]/20 focus:border-[#7B2220]"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>

            {/* Options List */}
            <div className="overflow-y-auto max-h-80">
              {filteredOptions.length === 0 ? (
                <div className="p-6 text-center text-sm text-gray-500">
                  No products found
                </div>
              ) : (
                filteredOptions.map((option) => {
                  const isSelected = option.id === value
                  const isAvailable = option.available !== false
                  const hasStock = typeof option.stock === "number" ? option.stock > 0 : true
                  const hasDailyLimit = typeof option.dailyLimit === "number" && option.dailyLimit > 0

                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => handleSelect(option.id)}
                      className={`
                        w-full text-left p-4 transition-all duration-150 border-b border-gray-100 last:border-b-0
                        ${isSelected
                          ? "bg-[#7B2220]/10 border-l-4 border-[#7B2220]"
                          : "hover:bg-gray-50 border-l-4 border-transparent"
                        }
                      `}
                    >
                      <div className="flex items-start gap-3">
                        {/* Product Icon */}
                        <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-to-br from-[#7B2220]/10 to-[#502455]/10 flex items-center justify-center">
                          {option.image ? (
                            <img
                              src={option.image}
                              alt={option.name}
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : (
                            <svg
                              className="w-6 h-6 text-[#7B2220]"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                              />
                            </svg>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <p className="text-sm font-semibold text-gray-900 truncate">
                              {option.name || "Unnamed Product"}
                            </p>
                            {isSelected && (
                              <div className="flex-shrink-0">
                                <svg
                                  className="w-5 h-5 text-[#7B2220]"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2 flex-wrap">
                            {option.price != null && (
                              <span className="text-xs font-semibold text-[#7B2220] bg-[#7B2220]/10 px-2 py-0.5 rounded">
                                €{option.price}
                              </span>
                            )}
                            {option.category && (
                              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                                {option.category}
                              </span>
                            )}
                            {!isAvailable && (
                              <span className="text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded">
                                Unavailable
                              </span>
                            )}
                            {hasDailyLimit && (
                              <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                                Limit: {option.dailyLimit}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  )
                })
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-gray-200 bg-gray-50">
              <p className="text-xs text-gray-500 text-center">
                {filteredOptions.length} product{filteredOptions.length !== 1 ? "s" : ""} available
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
