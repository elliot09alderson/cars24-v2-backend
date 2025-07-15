import {
  createCustomer,
  createRequirement,
} from "../controllers/customerController.js";
import { upload } from "../utils/multerConfig.js";

import express from "express";
export const customerRouter = express.Router();

customerRouter.post("/", upload.single("image"), createCustomer);
customerRouter.post("/requirement", createRequirement);
