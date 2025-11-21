import { useState } from "react";
import { useNavigate } from "react-router-dom"; // ✅ useNavigate
import axios from "../utils/axios";

const Login = () => {
  const navigate = useNavigate(); // ✅ instead of useRouter
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("rider");

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("/api/auth/login", { phone, password });
      const user = res.data.user;

      localStorage.setItem("user", JSON.stringify({ ...user, role }));

      if (role === "rider") navigate("/rider");
      else if (role === "driver") navigate("/driver");
    } catch (err) {
      console.error("Login error:", err.response?.data || err.message);
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <input
        type="text"
        placeholder="Phone"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <select value={role} onChange={(e) => setRole(e.target.value)}>
        <option value="rider">Rider</option>
        <option value="driver">Driver</option>
      </select>
      <button type="submit">Login</button>
    </form>
  );
};

export default Login;
