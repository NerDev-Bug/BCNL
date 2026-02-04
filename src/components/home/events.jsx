import { useEffect, useMemo, useRef, useState } from "react"

function Events() {
  const baseMedia = useMemo(
    () => [
      { type: "image", src: "./images/event1.png" },
      { type: "image", src: "./images/event2.png" },
      { type: "image", src: "./images/event3.png" },
    ],
    []
  )

  // Build: [clones][real][clones]
  // This makes the rail infinite-looking.
  const CLONE_SETS = 2
  const extended = useMemo(() => {
    const clonesBefore = Array.from({ length: CLONE_SETS }, () => baseMedia).flat()
    const clonesAfter = Array.from({ length: CLONE_SETS }, () => baseMedia).flat()
    return [...clonesBefore, ...baseMedia, ...clonesAfter]
  }, [baseMedia])

  const baseLen = baseMedia.length
  const beforeLen = CLONE_SETS * baseLen
  const realStart = beforeLen // index in extended where the "real" set begins
  const realEnd = realStart + baseLen - 1

  // We track an index inside EXTENDED array (so we can slide through clones)
  const [extIndex, setExtIndex] = useState(realStart)
  const [paused, setPaused] = useState(false)

  // For dots + modal, we use the base index (0..baseLen-1)
  const baseIndex = ((extIndex - realStart) % baseLen + baseLen) % baseLen

  // modal
  const [modalOpen, setModalOpen] = useState(false)
  const [modalIndex, setModalIndex] = useState(0)

  // swipe
  const touchStartX = useRef(null)
  const modalTouchStartX = useRef(null)

  // centering
  const railRef = useRef(null)
  const slideRefs = useRef([])

  const centerAt = (targetExtIndex, behavior = "smooth") => {
    const rail = railRef.current
    const slide = slideRefs.current[targetExtIndex]
    if (!rail || !slide) return

    const railWidth = rail.clientWidth
    const slideCenter = slide.offsetLeft + slide.clientWidth / 2
    const left = slideCenter - railWidth / 2
    rail.scrollTo({ left, behavior })
  }

  // Center whenever extIndex changes
  useEffect(() => {
    centerAt(extIndex, "smooth")
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [extIndex])

  // Keep centered on resize
  useEffect(() => {
    const onResize = () => centerAt(extIndex, "auto")
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [extIndex])

  // Seamless reset when we drift into far clones:
  // If we move past the real area, jump (no animation) to the equivalent "real" slide.
  useEffect(() => {
    // We only need to reset when extIndex goes outside [realStart..realEnd] range
    // but we allow a bit of room because user may move within clones.
    const minSafe = realStart - baseLen // one set before real
    const maxSafe = realEnd + baseLen // one set after real

    if (extIndex < minSafe || extIndex > maxSafe) {
      // map extIndex -> equivalent real index
      const normalizedBase = ((extIndex - realStart) % baseLen + baseLen) % baseLen
      const newExt = realStart + normalizedBase

      // Jump instantly and re-center without animation
      setExtIndex(newExt)
      requestAnimationFrame(() => centerAt(newExt, "auto"))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [extIndex])

  const next = () => setExtIndex((i) => i + 1)
  const prev = () => setExtIndex((i) => i - 1)

  const goToBase = (i) => {
    // go to the "real" copy of that base slide
    const newExt = realStart + i
    setExtIndex(newExt)
  }

  // auto-slide every 5s (pause on hover + modal)
  useEffect(() => {
    if (paused || modalOpen) return
    const t = setInterval(() => {
      setExtIndex((curr) => curr + 1)
    }, 5000)
    return () => clearInterval(t)
  }, [paused, modalOpen])

  // swipe main
  const onTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX
  }
  const onTouchEnd = (e) => {
    if (touchStartX.current == null) return
    const endX = e.changedTouches[0].clientX
    const diff = endX - touchStartX.current
    touchStartX.current = null
    if (Math.abs(diff) < 60) return
    diff < 0 ? next() : prev()
  }

  // modal
  const openModal = () => {
    setModalIndex(baseIndex)
    setModalOpen(true)
  }
  const closeModal = () => setModalOpen(false)
  const modalNext = () => setModalIndex((i) => (i + 1) % baseLen)
  const modalPrev = () => setModalIndex((i) => (i - 1 + baseLen) % baseLen)

  const onModalTouchStart = (e) => {
    modalTouchStartX.current = e.touches[0].clientX
  }
  const onModalTouchEnd = (e) => {
    if (modalTouchStartX.current == null) return
    const endX = e.changedTouches[0].clientX
    const diff = endX - modalTouchStartX.current
    modalTouchStartX.current = null
    if (Math.abs(diff) < 60) return
    diff < 0 ? modalNext() : modalPrev()
  }

  useEffect(() => {
    if (!modalOpen) return
    const onKeyDown = (e) => {
      if (e.key === "Escape") closeModal()
      if (e.key === "ArrowRight") modalNext()
      if (e.key === "ArrowLeft") modalPrev()
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [modalOpen])

  return (
    <div className="py-8 px-4 max-w-6xl mx-auto">
      <div
        className="relative -mx-4"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div
  ref={railRef}
  className="overflow-hidden w-full"
  style={{
    paddingLeft: 0,
    paddingRight: 0,
    touchAction: "pan-y",
  }}
>
  <div className="flex gap-0">
            {extended.map((item, i) => {
              const isActive = i === extIndex

              return (
                <div
                  key={`${item.src}-${i}`}
                  ref={(el) => (slideRefs.current[i] = el)}
                  className="shrink-0 cursor-pointer"
                  style={{ width: "88%" }} // ✅ peek size (75% = more peek; 85% = less peek)
                  onClick={() => {
                    if (isActive) openModal()
                    else setExtIndex(i)
                  }}
                >
                  <div className="h-[260px] md:h-[360px] overflow-hidden rounded-none">
                    {item.type === "video" ? (
                      <video
                        src={item.src}
                        controls
                        className={`w-full h-full object-cover transition-all duration-500 ${
                          isActive
                            ? "opacity-100 scale-100"
                            : "opacity-60 scale-[0.97]"
                        }`}
                      />
                    ) : (
                      <img
                        src={item.src}
                        alt=""
                        draggable={false}
                        className={`w-full h-full object-cover transition-all duration-500 ${
                          isActive
                            ? "opacity-100 scale-100"
                            : "opacity-60 scale-[0.97]"
                        }`}
                      />
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* arrows */}
        <button
          type="button"
          onClick={prev}
          className="absolute top-1/2 -translate-y-1/2 left-1 w-12 h-12 rounded-full bg-white/80 text-3xl shadow-md flex items-center justify-center hover:bg-white"
          aria-label="Previous"
        >
          ‹
        </button>
        <button
          type="button"
          onClick={next}
          className="absolute top-1/2 -translate-y-1/2 right-1 w-12 h-12 rounded-full bg-white/80 text-3xl shadow-md flex items-center justify-center hover:bg-white"
          aria-label="Next"
        >
          ›
        </button>
      </div>

      {/* dots (based on real slides) */}
      <div className="flex justify-center mt-4 gap-2">
        {baseMedia.map((_, i) => (
          <button
            key={i}
            onClick={() => goToBase(i)}
            className={`w-3 h-3 rounded-full transition-all ${
              i === baseIndex ? "bg-[#7B2220] scale-110" : "bg-gray-300"
            }`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>

      {/* FULLSCREEN MODAL */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center p-4"
          onClick={closeModal}
        >
          <div
            className="relative w-full h-full max-w-6xl max-h-[92vh]"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={onModalTouchStart}
            onTouchEnd={onModalTouchEnd}
          >
            <button
              type="button"
              onClick={closeModal}
              className="absolute top-3 right-3 z-10 w-11 h-11 rounded-full bg-white/90 text-2xl flex items-center justify-center hover:bg-white"
              aria-label="Close"
            >
              ✕
            </button>

            <div className="w-full h-full overflow-hidden rounded-xl bg-black">
              {baseMedia[modalIndex].type === "video" ? (
                <video
                  key={baseMedia[modalIndex].src}
                  src={baseMedia[modalIndex].src}
                  className="w-full h-full object-contain"
                  controls
                  autoPlay
                  playsInline
                />
              ) : (
                <img
                  key={baseMedia[modalIndex].src}
                  src={baseMedia[modalIndex].src}
                  alt=""
                  className="w-full h-full object-contain"
                  draggable={false}
                />
              )}
            </div>

            <button
              type="button"
              onClick={modalPrev}
              className="absolute top-1/2 -translate-y-1/2 left-3 w-12 h-12 rounded-full bg-white/80 text-3xl shadow-md flex items-center justify-center hover:bg-white"
              aria-label="Previous in modal"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={modalNext}
              className="absolute top-1/2 -translate-y-1/2 right-3 w-12 h-12 rounded-full bg-white/80 text-3xl shadow-md flex items-center justify-center hover:bg-white"
              aria-label="Next in modal"
            >
              ›
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Events
