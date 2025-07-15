import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import { adModel } from "../models/ad.js";

export const postad = async (req, res) => {
  try {
    const { url } = req.body;
    console.log(req.body);
    console.log(req.file);

    const file = req.file;

    const cropParams = {
      gravity: "auto", // Auto-detect best cropping area
      width: 1000, // Reduce resolution
      height: 1000, // Set height to ensure consistent dimensions
      crop: "fill", // Required for auto gravity
      quality: "auto:low", // Aggressive compression
    };

    try {
      if (file.size > 5 * 1024 * 1024) {
        throw new Error(`File ${file.originalname} exceeds 5MB limit`);
      }

      const result = await cloudinary.uploader.upload(file.path, {
        folder: "ads",
        resource_type: "image",
        format: "jpg",
        quality: "auto:low",
        transformation: cropParams,
      });

      fs.unlink(file.path, (err) => {
        if (err) console.error("Error deleting the file:", err);
      });

      const item = await adModel.create({ url, image: result.secure_url });
      return res.status(201).json({
        data: item,
        message: "ad added successfully",
      });
    } catch (err) {
      res.json({
        message: err.message,
      });
    }
  } catch (error) {
    return res.status(400).json({
      message: error.message,
    });
  }
};

export const fetchAds = async (req, res) => {
  try {
    const ads = await adModel.find();
    res.json({ message: "vehicles fetched successfully", data: ads });
  } catch (error) {
    return res.status(400).json({
      message: error.message,
    });
  }
};
