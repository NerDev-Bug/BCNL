import { useEffect } from "react"

function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Action",
  message = "Are you sure you want to proceed?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "confirm", // "confirm" | "alert"
  confirmButtonColor = "bg-[#7B2220]", // default red
  loading = false,
}) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }
    return () => {
      document.body.style.overflow = "unset"
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleConfirm = () => {
    if (!loading) {
      onConfirm?.()
    }
  }

  const handleCancel = () => {
    if (!loading) {
      onClose?.()
    }
  }

  return (
    <>
      {/* Overlay */}
      <div
        onClick={type === "alert" ? handleCancel : undefined}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all">
          {/* Header */}
          <div className="px-6 py-5 border-b border-gray-200">
            <h3 className="text-xl font-bold text-gray-900">{title}</h3>
          </div>

          {/* Body */}
          <div className="px-6 py-5">
            <p className="text-gray-600">{message}</p>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
            {type === "confirm" && (
              <button
                onClick={handleCancel}
                disabled={loading}
                className="px-6 py-2.5 rounded-xl border-2 border-gray-300 text-gray-700 font-medium hover:bg-gray-100 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cancelText}
              </button>
            )}
            <button
              onClick={handleConfirm}
              disabled={loading}
              className={`px-6 py-2.5 rounded-xl ${confirmButtonColor} text-white font-semibold hover:opacity-90 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
            >
              {loading ? (
                <>
                  <span className="animate-spin">⏳</span>
                  <span>Processing...</span>
                </>
              ) : (
                confirmText
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export default ConfirmationModal
