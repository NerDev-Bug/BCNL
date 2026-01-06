import { useEffect, useState } from "react";
import { registerUser } from "../services/authService";

function RegisterModal({ isOpen, onClose, onSwitchToLogin }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  if (!isOpen) return null;

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    if (!agree) {
      setError("You must agree to the Terms and Conditions");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      setLoading(true);
      await registerUser(email, password, username);
      onClose(); // close modal on success
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative bg-white w-full max-w-4xl rounded-lg overflow-hidden flex">

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-2 right-4 text-gray-500 hover:text-black text-2xl"
        >
          ×
        </button>

        {/* LEFT – Register Form */}
        <div className="w-1/2 p-8">
          <form onSubmit={handleRegister}>
            <div className="mb-4">
              <label className="block text-sm mb-1 text-[#7B2220]">
                Username
              </label>
              <input
                type="text"
                className="w-full border rounded px-3 py-2"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm mb-1 text-[#7B2220]">
                Email Address
              </label>
              <input
                type="email"
                className="w-full border rounded px-3 py-2"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm mb-1 text-[#7B2220]">
                Password
              </label>
              <input
                type="password"
                className="w-full border rounded px-3 py-2"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="mb-5">
              <label className="block text-sm mb-1 text-[#7B2220]">
                Confirm Password
              </label>
              <input
                type="password"
                className="w-full border rounded px-3 py-2"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
              {loading ? "Creating account..." : "Register"}
            </button>

            <label className="flex items-center gap-2 text-sm mt-3">
              <input
                type="checkbox"
                checked={agree}
                onChange={(e) => setAgree(e.target.checked)}
              />
              <span className="text-[#7B2220] cursor-pointer">
                Terms and Conditions
              </span>
            </label>

            <p className="text-sm mt-4">
              Already have an account?{" "}
              <span
                onClick={onSwitchToLogin}
                className="text-[#7B2220] font-semibold cursor-pointer"
              >
                Login
              </span>
            </p>
          </form>
        </div>

        {/* RIGHT – Image */}
        <div
          className="w-1/2 bg-cover bg-center"
          style={{
            backgroundImage: "url('./images/login-bg.png')",
          }}
        >
          <div className="p-6">
            <img
              src="./images/bcnl_logo.png"
              alt="Bake Corner"
              className="h-10"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default RegisterModal;
