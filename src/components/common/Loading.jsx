export default function Loading({
  message = "Loading...",
  fullscreen = false,
  size = "text-4xl",
}) {
  const content = (
    <div className="flex flex-col items-center justify-center text-center">
      <div className={`animate-spin mb-3 ${size}`}>⏳</div>
      <p className="text-gray-600">{message}</p>
    </div>
  )

  if (!fullscreen) return content

  return (
    <div className="flex items-center justify-center min-h-screen">
      {content}
    </div>
  )
}
