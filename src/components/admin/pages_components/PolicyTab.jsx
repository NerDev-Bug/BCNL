export default function PolicyTab({ form, update }) {
  return (
    <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 mb-6">
      <div className="mb-6 pb-4 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900">
          Policy & Ads Modal Settings
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Manage the content displayed in the Policy/Ads modal that appears on the Menu page
        </p>
      </div>

      <div className="space-y-6">
        {/* Title Field */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Modal Title
          </label>
          <input
            type="text"
            value={form.title || ""}
            onChange={(e) => update("title", e.target.value)}
            placeholder="e.g., Policy"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7B2220] focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">
            The title displayed at the top of the modal
          </p>
        </div>

        {/* Content Field */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Modal Content
          </label>
          <textarea
            value={form.content || ""}
            onChange={(e) => update("content", e.target.value)}
            placeholder="Enter the policy or advertisement content here..."
            rows={8}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7B2220] focus:border-transparent resize-y"
          />
          <p className="text-xs text-gray-500 mt-1">
            The main content displayed in the modal. This can include policy information, terms, or promotional messages.
          </p>
        </div>

        {/* Preview Section */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Preview
          </h3>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 max-w-md mx-auto">
            <div className="bg-white rounded-lg p-6 text-center shadow-sm">
              <h2 className="text-xl font-bold mb-3 font-cooper text-[#502455]">
                {form.title || "Policy"}
              </h2>
              <p className="text-sm text-gray-600 mb-4 whitespace-pre-wrap">
                {form.content || "Please be advised that any changes, cancellations, or special requests related to your order must be made at least five (5) days before the scheduled delivery date..."}
              </p>
              <button
                type="button"
                className="w-full bg-[#7B2220] text-white py-2 rounded-md hover:bg-[#502455] transition"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
