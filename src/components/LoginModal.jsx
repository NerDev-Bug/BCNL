import { useEffect } from "react";

function LoginModal({ isOpen, onClose, onSwitchToRegister }) {
  // Close modal on ESC key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative bg-white w-full max-w-3xl rounded-lg overflow-hidden flex">
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-4 text-gray-500 hover:text-black text-2xl"
        >
          ×
        </button>

        {/* Left: Login Form */}
        <div className="w-1/2 p-8">
          <img
            src="./images/bcnl_logo.png"
            alt="Bake Corner"
            className="h-10 mb-6"
          />

          <div className="mb-4">
            <label className="block text-sm mb-1">Login</label>
            <input
              type="email"
              className="w-full border rounded px-3 py-2"
              placeholder="Email"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm mb-1">Password</label>
            <input
              type="password"
              className="w-full border rounded px-3 py-2"
              placeholder="Password"
            />
          </div>

          <button className="w-full bg-[#7B2220] text-white py-2 rounded hover:opacity-90">
            Login
          </button>

          <div className="flex justify-between text-sm mt-3">
            <label className="flex items-center gap-2">
              <input type="checkbox" />
              Remember me
            </label>
            <span
              className="text-[#7B2220] cursor-pointer"
              onClick={() => console.log("Forgot password clicked")}
            >
              Forgot password
            </span>
          </div>

          <p className="text-sm mt-4">
            Don’t have an account?{" "}
            <span
              onClick={onSwitchToRegister}
              className="text-[#7B2220] cursor-pointer font-semibold"
            >
              Register
            </span>
          </p>
        </div>

        {/* Right: Image */}
        <div
          className="w-1/2 bg-cover bg-center"
          style={{
            backgroundImage: "url('./images/login-bg.png')",
          }}
        />
      </div>
    </div>
  );
}

export default LoginModal;
