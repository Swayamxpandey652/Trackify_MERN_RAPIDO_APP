import mongoose from "mongoose";


const userSchema = new mongoose.Schema({
name: { type: String, required: true },
phone: { type: String, required: true, unique: true },
password: { type: String, required: true },
email: { type: String, required: true, unique: true }, // added email field
role: { type: String, enum: ["rider", "driver"], default: "rider" },
createdAt: { type: Date, default: Date.now }
});


const User = mongoose.model("User", userSchema);
export default User;