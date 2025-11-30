import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";

export default function Login() {
  const [params] = useSearchParams();
  const roleFromURL = params.get("role") || "rider";

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const submitLogin = async (e) => {
  e.preventDefault();
  setLoading(true);

  try {
    const res = await axios.post("http://localhost:5000/api/auth/login", {
      phone,
      password,
      role: roleFromURL
    });

    const user = res.data.user;
    const token = res.data.token;

    // Save token
    localStorage.setItem("token", token);

    // Save the logged-in user
    localStorage.setItem("user", JSON.stringify(user));

    if (user.role === "driver") {
      // Save driver separately (same object)
      localStorage.setItem("driver", JSON.stringify(user));
      navigate("/driver");
    } else {
      localStorage.setItem("rider", JSON.stringify(user));
      navigate("/rider");
    }

  } catch (err) {
    alert(err.response?.data?.message || "Login failed");
  } finally {
    setLoading(false);
  }
};


  return (
    <div className="min-h-screen flex items-center justify-center bg-yellow-400 p-6">
      <div className="bg-white rounded-xl p-8 w-full max-w-md shadow-lg">

        <h2 className="text-2xl font-bold mb-4 text-center">
          {roleFromURL === "driver" ? "Driver Login" : "Rider Login"}
        </h2>

        <form onSubmit={submitLogin} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Phone Number"
            className="p-3 border rounded-lg"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            className="p-3 border rounded-lg"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            type="submit"
            className="bg-black text-white py-3 rounded-lg font-semibold"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="text-center mt-4">
          Don't have an account?{" "}
          <a href="/register" className="text-blue-500 underline">
            Register
          </a>
        </p>
      </div>
    </div>
  );
}
