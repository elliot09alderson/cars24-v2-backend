import mongoose from "mongoose";
import { boolean } from "zod";

const VehicleSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    serialNo: {
      type: String,
      required: true,
    },
    brand: {
      type: String,
      required: true,
      trim: true,
    },
    model: {
      type: String,
      required: true,
      trim: true,
    },
    year: {
      type: Number,
      required: true,
    },
    totalKmDriven: {
      type: Number,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    assured: {
      type: Boolean,
      default: false,
    },
    commision: { type: Number, default: 2 },
    bodyType: {
      type: String,
      enum: ["suv", "sedan", "hatchback", "car"],
    },
    transmission: {
      type: String,
      enum: ["manual", "automatic"],
    },
    fuelType: {
      type: String,
      enum: ["Petrol", "Diesel", "Electric", "Hybrid", "CNG", "LPG"], // you can adjust types
      required: true,
    },
    images: {
      type: [String], // Array of image URLs or paths
      default: [],
    },
    thumbnail: {
      type: String, // Single thumbnail URL or path
      default: "",
    },
    owners: {
      type: String,
      enum: ["1stOwner", "2ndOwner", "3rdOwner", "4thOwner"],
      required: true,
    },
    seat: {
      type: Number,
      enum: [4, 5, 6, 7, 8, 9],
    },
    color: {
      type: String,
    },
    isDisabled: {
      type: String,
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt
  }
);

export const VehicleModel = mongoose.model("Vehicle", VehicleSchema);
