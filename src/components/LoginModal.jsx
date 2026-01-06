import { useEffect, useState } from "react";
import { loginUser } from "../services/authService";

function LoginModal({ isOpen, onClose, onSwitchToRegister }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Close modal on ESC key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  if (!isOpen) return null;

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await loginUser(email, password);
      onClose(); // close modal on success
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

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

          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label className="block text-sm mb-1">Email</label>
              <input
                type="email"
                className="w-full border rounded px-3 py-2"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm mb-1">Password</label>
              <input
                type="password"
                className="w-full border rounded px-3 py-2"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <p className="text-red-600 text-sm mb-3">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#7B2220] text-white py-2 rounded hover:opacity-90 disabled:opacity-60"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          <div className="flex justify-between text-sm mt-3">
            <label className="flex items-center gap-2">
              <input type="checkbox" />
              Remember me
            </label>
            <span
              className="text-[#7B2220] cursor-pointer"
              onClick={() => alert("Forgot password coming soon")}
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
