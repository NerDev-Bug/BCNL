function WhatsAppIcon() {
  const phone = "639105171791"; // ✅ international format, no +

  const url = `https://wa.me/${phone}`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      className="fixed bottom-6 right-6 z-[10] bg-[#502455] p-4 rounded-full shadow-lg hover:scale-110 transition"
    >
      <svg
        viewBox="0 0 32 32"
        width="28"
        height="28"
        fill="white"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M16 2.9C8.8 2.9 2.9 8.7 2.9 15.9c0 2.8.8 5.4 2.4 7.6L2 30l6.7-2.2c2.1 1.2 4.6 1.9 7.3 1.9 7.2 0 13.1-5.8 13.1-13S23.2 2.9 16 2.9z" />
      </svg>
    </a>
  );
}

export default WhatsAppIcon;
