import {
  createCustomer,
  createRequirement,
  getProfile,
  updateProfile,
  addToWishlist,
  removeFromWishlist,
  getWishlist,
} from "../controllers/customerController.js";
import { upload } from "../utils/multerConfig.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

import express from "express";
export const customerRouter = express.Router();

// Public routes
customerRouter.post("/", upload.single("image"), createCustomer);
customerRouter.post("/requirement", createRequirement);

// Protected routes (require authentication)
customerRouter.get("/profile", authMiddleware.customerMiddleware, getProfile);
customerRouter.put("/profile", authMiddleware.customerMiddleware, upload.single("avatar"), updateProfile);

// Wishlist routes
customerRouter.get("/wishlist", authMiddleware.customerMiddleware, getWishlist);
customerRouter.post("/wishlist", authMiddleware.customerMiddleware, addToWishlist);
customerRouter.delete("/wishlist/:vehicleId", authMiddleware.customerMiddleware, removeFromWishlist);
