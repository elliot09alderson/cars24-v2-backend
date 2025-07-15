import mongoose from "mongoose";

const CustomerSchema = new mongoose.Schema(
  {
    avatar: {
      type: String,
      required: false,
    },
    address: {
      type: String,
      required: false,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    phoneNumber: {
      type: String,
      required: true,
    },
    role: { type: String, enum: ["customer"], default: "customer" },
    token: {
      type: String,
    },
    tokenExpiry: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

export const Customer = mongoose.model("Customer", CustomerSchema);
