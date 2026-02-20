export default function EventsModal({ event, onClose }) {
  if (!event) return null

  return (
    <div
      className="fixed inset-0 bg-black/70 z-[9999] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white max-w-3xl w-full rounded-2xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* MEDIA */}
        <div className="h-64 bg-gray-100">
          {event.media.type === "video" ? (
            <video
              src={event.media.src}
              className="w-full h-full object-cover"
              controls
              autoPlay
            />
          ) : (
            <img
              src={event.media.src}
              alt={event.title}
              className="w-full h-full object-cover"
            />
          )}
        </div>

        {/* CONTENT */}
        <div className="p-6">
          <h2 className="text-2xl font-extrabold mb-3">
            {event.title}
          </h2>

          <p className="text-sm text-gray-700 leading-relaxed">
            {event.description}
          </p>

          <button
            onClick={onClose}
            className="mt-6 px-6 py-2 bg-[#1AA7A1] text-white rounded-lg"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}