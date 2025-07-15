import express from "express";

import {
  addVehicle,
  filterData,
  getAgentVehicleAds,
  getModelsByBrand,
  getVehicleBrands,
  getVehicles,
  searchVehicles,
  vehicleDetails,
} from "../controllers/vehicleController.js";
import { upload } from "../utils/multerConfig.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

export const vehicleRouter = express.Router();

vehicleRouter.post(
  "/agent/vehicle",
  upload.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "vehicleimages", maxCount: 5 },
  ]),
  authMiddleware.agentMiddleware,
  addVehicle
);
vehicleRouter.get("/vehicles", getVehicles);
vehicleRouter.get("/vehicles/filter-data", filterData);
vehicleRouter.get("/vehicles/filter/:brand", getModelsByBrand);
vehicleRouter.get("/vehicles/brands", getVehicleBrands);
vehicleRouter.get("/vehicles/:id", getAgentVehicleAds);
vehicleRouter.get("/vehicles/detail/:slug", vehicleDetails);
vehicleRouter.get("/vehicles/search/:search", searchVehicles);
