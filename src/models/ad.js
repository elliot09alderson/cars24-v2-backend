import mongoose from "mongoose";

const ad = new mongoose.Schema(
  {
    image: {
      type: String,
      default: "",
    },
    url: {
      type: String,
      required: true,
    },
  },

  {
    timestamps: true,
  }
);

export const adModel = mongoose.model("ad", ad);
