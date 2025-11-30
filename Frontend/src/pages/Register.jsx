import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const navigate = useNavigate();

  const [role, setRole] = useState("rider");

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    vehicleNumber: "",
    vehicleType: "bike",
  });

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const submitRegister = async (e) => {
    e.preventDefault();

    try {
      await axios.post("http://localhost:5000/api/auth/register", {
        ...form,
        role,
      });

      alert("Registered successfully!");
      navigate(`/login?role=${role}`);
    } catch (err) {
      alert(err.response?.data?.message || "Registration failed");
    }
  };

  return (
    <div className="min-h-screen bg-yellow-400 flex items-center justify-center p-6">
      <div className="bg-white rounded-xl p-8 w-full max-w-md shadow">

        <h2 className="text-2xl font-bold text-center mb-4">
          Create Account
        </h2>

        {/* Role Selection */}
        <div className="flex gap-4 mb-4">
          <button
            className={`flex-1 py-2 rounded-lg ${role === "rider" ? "bg-black text-white" : "bg-gray-200"}`}
            onClick={() => setRole("rider")}
          >
            Rider
          </button>

          <button
            className={`flex-1 py-2 rounded-lg ${role === "driver" ? "bg-black text-white" : "bg-gray-200"}`}
            onClick={() => setRole("driver")}
          >
            Driver
          </button>
        </div>

        <form className="flex flex-col gap-4" onSubmit={submitRegister}>
          <input name="name" placeholder="Full Name" className="p-3 border rounded-lg" onChange={handleChange} />

          <input name="phone" placeholder="Phone Number" className="p-3 border rounded-lg" onChange={handleChange} />

          <input name="email" placeholder="Email" className="p-3 border rounded-lg" onChange={handleChange} />

          <input name="password" type="password" placeholder="Password" className="p-3 border rounded-lg" onChange={handleChange} />

          {/* Driver-only fields */}
          {role === "driver" && (
            <>
              <input name="vehicleNumber" placeholder="Vehicle Number" className="p-3 border rounded-lg" onChange={handleChange} />

              <select name="vehicleType" className="p-3 border rounded-lg" onChange={handleChange}>
                <option value="bike">Bike</option>
                <option value="auto">Auto</option>
                <option value="car">Car</option>
              </select>
            </>
          )}

          <button className="bg-black text-white py-3 rounded-lg font-semibold">
            Register
          </button>
        </form>
      </div>
    </div>
  );
}
