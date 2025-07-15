import mongoose from "mongoose";

const AdminSchema = new mongoose.Schema(
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
    role: { type: String, enum: ["admin"], default: "admin" },
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

export const Admin = mongoose.model("Admin", AdminSchema);
