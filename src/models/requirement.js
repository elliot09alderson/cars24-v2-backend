import mongoose from "mongoose";

const RequirementSchema = new mongoose.Schema(
  {
    vehicle: {
      type: String,
      required: false,
    },
    from: {
      type: String,
      required: false,
    },
    to: {
      type: String,
      required: false,
    },
    budget: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },

    phoneNumber: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

export const Requirement = mongoose.model(
  "CustomerRequirement",
  RequirementSchema
);
