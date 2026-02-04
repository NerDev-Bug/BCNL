export default function TabsHeader({ activeTab, setActiveTab }) {
  const tabBtn = (key) =>
    `px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
      activeTab === key
        ? "bg-[#7B2220] text-white"
        : "bg-white border text-[#7B2220] hover:bg-[#7B2220] hover:text-white"
    }`

  return (
    <div className="flex items-center justify-between mb-6">
      <h1 className="text-2xl font-bold">Pages</h1>

      <div className="flex gap-2 flex-wrap">
        <button
          type="button"
          className={tabBtn("home")}
          onClick={() => setActiveTab("home")}
        >
          Home
        </button>

        <button
          type="button"
          className={tabBtn("favorites")}
          onClick={() => setActiveTab("favorites")}
        >
          Favorites
        </button>

        <button
          type="button"
          className={tabBtn("stories")}
          onClick={() => setActiveTab("stories")}
        >
          Our Stories
        </button>

        <button
          type="button"
          className={tabBtn("testimonials")}
          onClick={() => setActiveTab("testimonials")}
        >
          Testimonials
        </button>

        {/* ✅ NEW */}
        <button
          type="button"
          className={tabBtn("events")}
          onClick={() => setActiveTab("events")}
        >
          Events
        </button>
      </div>
    </div>
  )
}
