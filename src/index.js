import express from "express";
import dotenv from "dotenv";
import { connectDB } from "./db/db.js";
import { v2 as cloudinary } from "cloudinary";
import multer from "multer";
import cookieParser from "cookie-parser";
import cors from "cors";
import { vehicleRouter } from "./routes/vehicleRoutes.js";
import { adRouter } from "./routes/adRoutes.js";
import { authRouter } from "./routes/authRouter.js";
import { customerRouter } from "./routes/customer.js";
import { AdminRouter } from "./routes/admin.js";
import { agentRouter } from "./routes/agentRouter.js";

export const app = express();
app.use(
  cors({
    origin: ["http://localhost:8080", "https://frontend-cars24.vercel.app"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);
app.use(express.json());
dotenv.config({ path: "./src/.env" });
app.use(cookieParser());
export const upload = multer({
  dest: "uploads/",
});

cloudinary.config({
  cloud_name: process.env.cloud_name,
  api_key: process.env.api_key,
  api_secret: process.env.api_secret,
  secure: true,
});

connectDB();

app.use("/api/v1/", vehicleRouter);
app.use("/api/v1/", adRouter);
app.use("/api/v1/agent", agentRouter);

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/customer", customerRouter);
app.use("/api/v1/admin", AdminRouter);

app.listen(4000, () => console.log("port is running on 4k"));
