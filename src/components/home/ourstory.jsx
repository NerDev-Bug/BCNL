import { useEffect, useState } from "react"

function OurStory() {
    const testimonials = [
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
  ];

  const [current, setCurrent] = useState(0);

  // Auto slide
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [testimonials.length]);
  
  return (
    <section className="max-w-7xl mx-auto px-4 py-16">
      {/* Heading */}
      <h2 className="text-4xl font-bold text-center font-cooper text-[#5B1E5D] mb-16">
        Our Story
      </h2>

      {/* Section 1 */}
        <section className="flex flex-col md:flex-row items-center mb-16">
            <div className="md:w-1/2 mb-8 md:mb-0 md:pr-8">
                <div>
                    <h1 className="text-2xl font-bold mb-4">Lorem Ipsum is simply dummy text of</h1>
                    <div>
                        <p className="mb-4">Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged.</p>
                    </div>
                    <button className="bg-[#7B2220] text-white px-6 py-2 rounded-md mt-4">Contact Us</button>
                </div>
            </div>
            <div className="md:w-2/3 md:pl-8 relative">
                <img
                    src="./images/redpaint.png"
                    alt="red paint bg"
                    className="w-full h-auto rounded-md"
                />

                <img
                    src="./images/single_frame_img.png"
                    alt="our story"
                    className="absolute inset-0 m-auto w-90 h-80 rounded-md shadow-lg z-10"
                />
            </div>
        </section>

        {/* Section 2 */}
        <section className="flex flex-col-reverse md:flex-row items-center mb-16">
            <div className="md:w-2/3 relative md:pr-8">
                <img
                    src="./images/bg_purple.png"
                    alt="red paint bg"
                    className="w-full h-auto rounded-md"
                />

                <img
                    src="./images/group_frame_img.png"
                    alt="our story"
                    className="absolute inset-0 m-auto w-90 h-80 rounded-md shadow-lg z-10"
                />
            </div>
            <div className="md:w-1/2 mb-8 md:mb-0 md:pl-8 py-8">
                <div>
                    <h1 className="text-2xl font-bold mb-4">Lorem Ipsum is simply dummy text of</h1>
                    <div>
                        <p className="mb-4">Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged.</p>
                    </div>
                    <button className="bg-[#7B2220] text-white px-6 py-2 rounded-md mt-4">Contact Us</button>
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
          {testimonials.map((item, index) => (
            <div key={index} className="min-w-full px-6">
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
          {testimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrent(index)}
              className={`w-2.5 h-2.5 rounded-full transition-all ${
                current === index
                  ? "bg-gray-700 scale-110"
                  : "bg-gray-300"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

export default OurStory
