import mongoose from "mongoose";

const documentSchema = new mongoose.Schema(
  {
    agentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Agent", // Assuming your agent model is named 'Agent'
      required: true,
    },
    adhaar: {
      number: {
        type: String,
      },
      adhaarImage: {
        type: String, // URL to the image
      },
    },
    pan: {
      number: {
        type: String,
      },
      panImage: {
        type: String, // URL to the image
      },
    },
    licence: {
      number: {
        type: String,
      },
      licenceImage: {
        type: String, // URL to the image
      },
    },
    gst: {
      number: {
        type: String,
      },
      gstImage: {
        type: String, // URL to the image
      },
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt timestamps
  }
);

export const Document = mongoose.model("Document", documentSchema);
