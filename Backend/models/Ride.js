import mongoose from "mongoose";

const rideSchema = new mongoose.Schema(
  {
    rider: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    driver: { type: mongoose.Schema.Types.ObjectId, ref: "Driver" },
    pickup: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    dropoff: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    status: {
      type: String,
      enum: ["requested", "accepted", "in-progress", "completed", "cancelled"],
      default: "requested",
    },
    fare: { type: Number },

    // optional: last known driver location
    driverLocation: { lat: Number, lng: Number },
  },
  { timestamps: true }
);

export default mongoose.model("Ride", rideSchema);
