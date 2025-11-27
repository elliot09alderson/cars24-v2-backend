import { upload } from "../utils/multerConfig.js";

import express from "express";
import {
  createAdmin,
  getAllAgents,
  getAllCustomers,
  getDashboardStats,
  updateAgentStatus,
  updateVehicleStatus,
  deleteVehicle,
} from "../controllers/adminController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

export const AdminRouter = express.Router();

// Public route - create admin
AdminRouter.post("/", upload.single("image"), createAdmin);

// Protected admin routes
AdminRouter.get("/agents", authMiddleware.adminMiddleware, getAllAgents);
AdminRouter.get("/customers", authMiddleware.adminMiddleware, getAllCustomers);
AdminRouter.get("/dashboard/stats", authMiddleware.adminMiddleware, getDashboardStats);
AdminRouter.put("/agent/status", authMiddleware.adminMiddleware, updateAgentStatus);
AdminRouter.put("/vehicle/status", authMiddleware.adminMiddleware, updateVehicleStatus);
AdminRouter.delete("/vehicle/:vehicleId", authMiddleware.adminMiddleware, deleteVehicle);
