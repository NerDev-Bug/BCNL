import { useState } from "react"

function WhatsAppWidget() {
  const [open, setOpen] = useState(false)

  const phone = "" // international format, no + ex.(63912345678)
  const waUrl = `https://wa.me/${phone}?text=Hi%20I%20need%20help`

  return (
    <>
      {/* TOOLTIP (only when widget is closed) */}
      {!open && (
        <div className="fixed bottom-8 right-24 z-[30] hidden sm:block">
          <div className="bg-white text-gray-800 text-sm px-4 py-2 rounded-lg shadow-xl relative">
            Need Help? <span className="font-semibold">Chat with us</span>

            {/* arrow */}
            <span className="absolute right-[-6px] top-1/2 -translate-y-1/2 w-3 h-3 bg-white rotate-45 shadow-lg"></span>
          </div>
        </div>
      )}

      {/* FLOATING WHATSAPP BUTTON */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Open WhatsApp chat"
        className="fixed bottom-6 right-6 z-[30] bg-[#5B1E5D] w-16 h-16 rounded-full shadow-lg hover:scale-110 transition flex items-center justify-center"
      >
        <img
          src="/images/whatsappicon.png"
          alt="WhatsApp"
          className="w-8 h-8"
        />
      </button>

      {/* CHAT POPUP */}
      {open && (
        <div className="fixed bottom-24 right-6 w-80 bg-white rounded-lg shadow-2xl z-[30] overflow-hidden animate-fadeIn">
          {/* HEADER */}
          <div className="bg-[#5B1E5D] text-white px-4 py-3 relative">
            <p className="font-semibold text-sm">Start a Conversation</p>
            <p className="text-xs opacity-90">
              Hi! Click below to chat on WhatsApp
            </p>

            <button
              onClick={() => setOpen(false)}
              className="absolute right-3 top-3 text-white text-lg"
              aria-label="Close chat"
            >
              ✕
            </button>
          </div>

          {/* BODY */}
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-4 py-4 hover:bg-gray-100 transition"
          >
            <div className="w-10 h-10 rounded-full bg-[#5B1E5D] flex items-center justify-center">
              <img
                src="/images/whatsappicon.png"
                alt="WhatsApp"
                className="w-6 h-6"
              />
            </div>

            <div className="flex-1">
              <p className="font-semibold text-sm text-gray-800">
                BCNL Customer Support
              </p>
              <p className="text-xs text-gray-500">
                Click Now
              </p>
            </div>
          </a>
        </div>
      )}
    </>
  )
}

export default WhatsAppWidget
