import {
  adminLogin,
  adminLogout,
  agentLogin,
  agentLogout,
  checkAuth,
  customerLogin,
  customerLogout,
} from "../controllers/authController.js";

import express from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";

export const authRouter = express.Router();
authRouter.get("/check", authMiddleware.commonMiddleware, checkAuth);

authRouter.post("/customer/login", customerLogin);

authRouter.post("/customer/logout", customerLogout);
authRouter.post("/agent/login", agentLogin);
authRouter.post("/agent/logout", authMiddleware.agentMiddleware, agentLogout);

authRouter.post("/admin/login", adminLogin);
authRouter.post("/admin/logout", adminLogout);
