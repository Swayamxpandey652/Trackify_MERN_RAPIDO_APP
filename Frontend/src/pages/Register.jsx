// src/pages/Register.jsx
"use client";
import { useState } from "react";
import axios from "axios";

const Register = () => {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
        const res = await axios.post("http://localhost:5000/api/auth/register", {
            phone,
            password
        });

        console.log("Registered successfully:", res.data);
      // redirect to login or dashboard
    } catch (err) {
      console.error("Register error:", err.response?.data || err.message);
    }
  };

  return (
    <div>
      <h1>Register</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="tel"
          placeholder="Phone number"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Register</button>
      </form>
    </div>
  );
};

export default Register; // ✅ default export is required
