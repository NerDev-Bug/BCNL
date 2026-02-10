export default function TabsHeader({ activeTab, setActiveTab }) {
  const tabs = [
    { key: "home", label: "Home" },
    { key: "favorites", label: "Favorites" },
    { key: "stories", label: "Our Stories" },
    { key: "testimonials", label: "Testimonials" },
    { key: "events", label: "Events" },
  ]

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Pages Management</h1>
          <p className="text-sm text-gray-500">Manage your website content and sections</p>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap border-b border-gray-200 pb-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`
                relative px-6 py-3 text-sm font-semibold transition-all duration-200
                rounded-t-lg border-b-2 border-transparent
                ${
                  isActive
                    ? "text-[#7B2220] border-[#7B2220] bg-[#7B2220]/5"
                    : "text-gray-600 hover:text-[#7B2220] hover:bg-gray-50"
                }
              `}
            >
              {tab.label}
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#7B2220] rounded-full" />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
