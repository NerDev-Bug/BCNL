import { useEffect, useState } from "react"
import { db } from "../../firebase" // adjust path if needed
import { doc, onSnapshot } from "firebase/firestore"

function OurStory() {
  const [current, setCurrent] = useState(0)

  const [content, setContent] = useState({
    heading: "Our Story",
    section1: {
      title: "Lorem Ipsum is simply dummy text of",
      body:
        "Lorem Ipsum is simply dummy text of the printing and typesetting industry...",
      ctaText: "Contact Us",
      bgImage: "./images/redpaint.png",
      frameImage: "./images/single_frame_img.png",
    },
    section2: {
      title: "Lorem Ipsum is simply dummy text of",
      body:
        "Lorem Ipsum is simply dummy text of the printing and typesetting industry...",
      ctaText: "Contact Us",
      bgImage: "./images/bg_purple.png",
      frameImage: "./images/group_frame_img.png",
    },
    testimonials: [
      {
        text: "The experience was absolutely wonderful. Everything felt personal and thoughtful.",
        author: "– Anna Williams",
      },
      {
        text: "High quality service and incredible attention to detail. Highly recommended!",
        author: "– John Carter",
      },
      {
        text: "A beautiful journey from start to finish. I would definitely come back again.",
        author: "– Maria Lopez",
      },
    ],
  })

  // 🔥 Realtime load from Firestore
  useEffect(() => {
    const ref = doc(db, "pages", "ourStory")
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        const data = snap.data()
        setContent((prev) => ({
          ...prev,
          ...data,
          section1: { ...prev.section1, ...(data.section1 || {}) },
          section2: { ...prev.section2, ...(data.section2 || {}) },
          testimonials: Array.isArray(data.testimonials)
            ? data.testimonials
            : prev.testimonials,
        }))
      }
    })
    return () => unsub()
  }, [])

  // Auto slide (depends on testimonials length)
  useEffect(() => {
    if (!content.testimonials?.length) return
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % content.testimonials.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [content.testimonials?.length])

  const t = content.testimonials || []

  return (
    <section className="max-w-7xl mx-auto px-4 py-16">
      {/* Heading */}
      <h2 className="text-4xl font-bold text-center font-cooper text-[#5B1E5D] mb-16">
        {content.heading}
      </h2>

      {/* Section 1 */}
      <section className="flex flex-col md:flex-row items-center mb-16">
        <div className="md:w-1/2 mb-8 md:mb-0 md:pr-8">
          <div>
            <h1 className="text-2xl font-bold mb-4">{content.section1.title}</h1>
            <div>
              <p className="mb-4">{content.section1.body}</p>
            </div>
            <button className="bg-[#7B2220] text-white px-6 py-2 rounded-md mt-4">
              {content.section1.ctaText || "Contact Us"}
            </button>
          </div>
        </div>

        <div className="md:w-2/3 md:pl-8 relative">
          <img
            src={content.section1.bgImage}
            alt="red paint bg"
            className="w-full h-auto rounded-md"
          />
          <img
            src={content.section1.frameImage}
            alt="our story"
            className="absolute inset-0 m-auto w-90 h-80 rounded-md shadow-lg z-10"
          />
        </div>
      </section>

      {/* Section 2 */}
      <section className="flex flex-col-reverse md:flex-row items-center mb-16">
        <div className="md:w-2/3 relative md:pr-8">
          <img
            src={content.section2.bgImage}
            alt="purple bg"
            className="w-full h-auto rounded-md"
          />
          <img
            src={content.section2.frameImage}
            alt="our story"
            className="absolute inset-0 m-auto w-90 h-80 rounded-md shadow-lg z-10"
          />
        </div>

        <div className="md:w-1/2 mb-8 md:mb-0 md:pl-8 py-8">
          <div>
            <h1 className="text-2xl font-bold mb-4">{content.section2.title}</h1>
            <div>
              <p className="mb-4">{content.section2.body}</p>
            </div>
            <button className="bg-[#7B2220] text-white px-6 py-2 rounded-md mt-4">
              {content.section2.ctaText || "Contact Us"}
            </button>
          </div>
        </div>
      </section>

      {/* Feedback / Testimonial Carousel */}
      <div
        className="rounded-2xl p-12 text-center max-w-5xl mx-auto relative
                   bg-[url('./images/rippednotes.jpg')] bg-cover bg-center bg-no-repeat
                   overflow-hidden"
      >
        {/* Slides */}
        <div
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${current * 100}%)` }}
        >
          {t.map((item, index) => (
            <div key={index} className="min-w-full px-12">
              <span className="text-6xl font-bold block mb-6">“</span>
              <p className="text-black max-w-3xl mx-auto mb-6 leading-relaxed">
                {item.text}
              </p>
              <p className="font-semibold">{item.author}</p>
            </div>
          ))}
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-2 mt-8">
          {t.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrent(index)}
              className={`w-2.5 h-2.5 rounded-full transition-all ${
                current === index ? "bg-gray-700 scale-110" : "bg-gray-300"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

export default OurStory
