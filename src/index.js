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
dotenv.config({ path: "./src/.env" });
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps, curl, postman)
      if (!origin) return callback(null, true);
      
      const allowedOrigins = [
        "http://localhost:8080",
        "http://localhost:8081",
        "http://localhost:5173",
        process.env.DEPOLYED_FRONTEND_URL,
        "https://frontend-cars24.vercel.app",
        "https://cars24-v2-frontend.vercel.app",
        "https://cars24-v2-frontend-vrws.vercel.app",
      ];
      
      // Allow any local network IP (192.168.x.x, 10.x.x.x, etc.) on ports 8080, 8081, 5173
      if (
        origin.match(/^http:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+):(8080|8081|5173)$/)
      ) {
        return callback(null, true);
      }
      
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);
app.use(express.json());
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
app.get("/", (req, res) => {
  res.json({
    msg: "hii working ",
  });
});
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/customer", customerRouter);
app.use("/api/v1/admin", AdminRouter);

app.listen(4000, () => console.log("port is running on 4k"));
