import { useEffect } from "react"
import { useLocation } from "react-router-dom"

function ScrollToTop() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    // If there's a hash, let hash scrolling handle it
    if (hash) return

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    })
  }, [pathname, hash])

  return null
}

export default ScrollToTop
