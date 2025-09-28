import mongoose, { Schema, model, models } from "mongoose";

const ParkedVehicleSchema = new Schema(
  {
    slotNumber: {
      type: Number,
      required: true,
    },
    floorNumber: {
      type: Number,
      required: true,
      default: 1,
    },
    vehicleNumber: {
      type: String,
      required: true,
    },
    vehicleType: {
      type: String,
      enum: ["SUV", "Sedan", "Heavy", "TwoWheeler"],
      required: true,
    },
    parkedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { collection: "parked_vehicles" } // explicitly set collection name
);

// Use existing model if it exists (avoid recompilation in Next.js hot reload)
const ParkedVehicle = models.ParkedVehicle || model("ParkedVehicle", ParkedVehicleSchema);

export default ParkedVehicle;
