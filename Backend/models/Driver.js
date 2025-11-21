import mongoose from "mongoose";

const driverSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    password: { type: String, required: true },

    vehicleNumber: { type: String, required: true },
    vehicleType: { type: String, enum: ["bike", "auto", "car"], required: true },

    isAvailable: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export default mongoose.model("Driver", driverSchema);
