import { Admin } from "../models/admin.js";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { upload } from "../utils/multerConfig.js";

import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

const adminSchema = z.object({
  name: z.string().min(3, { message: "Name is required" }),
  email: z.string().email({ message: "Invalid email format" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long" }),
  address: z.string().optional(), // Address is optional
  phoneNumber: z
    .string()
    .regex(/^\d{10}$/, { message: "Phone number must be exactly 10 digits" }),
});

export async function createAdmin(req, res) {
  const { email, password, name, phoneNumber } = req.body;
  const parsed = adminSchema.safeParse({
    name,
    email,
    password,
    phoneNumber,
  });

  const file = req.file;
  const cropParams = {
    gravity: "auto",
    width: 300,
    height: 300,
    crop: "crop",
  };

  const isPresent = await Admin.findOne({
    $or: [{ email }, { phoneNumber }],
  });

  if (isPresent) {
    return res
      .status(409)
      .json({ message: "Email or phone number already exists" });
  }

  try {
    let result = "";
    if (file) {
      result = await cloudinary.uploader.upload(file?.path, {
        folder: "cars24",
        resource_type: "raw",
        transformation: cropParams,
      });
      fs.unlink(file.path, (err) => {
        if (err) {
          console.error("Error deleting the file:", err);
        } else {
          console.log("File deleted successfully:", file.path);
        }
      });
    }

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: parsed.error.errors.map((err) => ({
          path: err.path,
          message: err.message,
        })),
      });
    }

    const encryptedPass = await bcrypt.hash(parsed.data.password, 10);
    parsed.data.password = encryptedPass;

    const admin = await Admin.create({
      ...parsed.data,
      avatar: result?.url || "",
    });

    if (admin) {
      return res.status(201).json({
        success: true,
        message: "admin registered successfully",
        admin,
      });
    }
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}
