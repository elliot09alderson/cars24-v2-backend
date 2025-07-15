import {
  createAgent,
  editAgentDetails,
  fetchAgentAds,
  getAgentDetails,
  uploadAgentDocument,
} from "../controllers/agentController.js";

import express from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { upload } from "../utils/multerConfig.js";

export const agentRouter = express.Router();
/**
 *
 * READ
 *
 */
agentRouter.get("/me", authMiddleware.agentMiddleware, getAgentDetails);

agentRouter.post(
  "/uploadDocument",
  authMiddleware.agentMiddleware,
  upload.fields([
    { name: "adhaarImage", maxCount: 1 },
    { name: "panImage", maxCount: 1 },
    { name: "licenceImage", maxCount: 1 },
    { name: "gstImage", maxCount: 1 },
  ]),
  uploadAgentDocument
);

/**
 *
 * CREATE
 *
 */
agentRouter.post("/", upload.single("image"), createAgent);

/**
 *
 * UPDATE
 *
 */
agentRouter.put("/", authMiddleware.agentMiddleware, editAgentDetails);

/**
 *
 * DELETE
 *
 */
// agentRouter.delete("/:id", deactivateagent);

agentRouter.get("/myads", authMiddleware.agentMiddleware, fetchAgentAds);
