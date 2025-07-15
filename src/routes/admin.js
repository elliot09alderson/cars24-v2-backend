import { upload } from "../utils/multerConfig.js";

import express from "express";
import { createAdmin } from "../controllers/adminController.js";
export const AdminRouter = express.Router();

AdminRouter.post("/", upload.single("image"), createAdmin);
