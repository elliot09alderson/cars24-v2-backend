import express from "express";

import { upload } from "../utils/multerConfig.js";
import { fetchAds, postad } from "../controllers/adController.js";

export const adRouter = express.Router();

adRouter.post("/ad", upload.single("image"), postad);
adRouter.get("/ads", fetchAds);
