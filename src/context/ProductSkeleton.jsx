export default function ProductSkeleton({ count = 1, className = "", imageHeight = "h-80" }) {
  return (
    <>
      {[...Array(count)].map((_, i) => (
        <div
          key={i}
          className={`bg-white border border-[#7B2220] rounded-md shadow-md ${className}`}
        >
          <div className="p-4">
            <div className={`${imageHeight} bg-gray-200 rounded-md`} />
          </div>

          <div className="px-6 pb-6">
            <div className="h-5 bg-gray-200 rounded w-3/4 mx-auto mb-3" />
            <div className="h-4 bg-gray-200 rounded w-1/3 mx-auto mb-6" />

            <div className="flex gap-4">
              <div className="h-10 bg-gray-200 rounded w-full" />
              <div className="h-10 bg-gray-300 rounded w-full" />
            </div>
          </div>
        </div>
      ))}
    </>
  )
}
