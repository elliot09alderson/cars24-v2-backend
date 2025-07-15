import { validateVehicle } from "../validations/vehicleValidation.js";
import { VehicleModel } from "../models/vehicle.js";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import { slugify } from "../utils/slugify.js";
import { Agent } from "../models/agent.js";
export const addVehicle = async (req, res) => {
  console.log("uploading....");
  try {
    const parseIfNumber = (value) =>
      isNaN(value) ? value : parseInt(value, 10);
    const parseIfBoolean = (value) =>
      typeof value === "string"
        ? value.toLowerCase() === "true"
        : Boolean(value);

    const {
      name,
      brand,
      model,
      year,
      totalKmDriven,
      location,
      price,
      fuelType,
      transmission,
      owners,
      serialNo,
    } = req.body;

    const slug = slugify(name, model);
    console.log("crossed .. ");
    console.log(req.files);
    const files = req.files["vehicleimages"];
    console.log("2nd crossed .. ");
    const safeToLowerCase = (value) => {
      return typeof value === "string" ? value.toLowerCase() : value;
    };

    const { data, success } = validateVehicle({
      name,
      slug,
      brand: safeToLowerCase(brand),
      model: safeToLowerCase(model),
      year: parseIfNumber(year),
      serialNo,
      transmission,
      totalKmDriven: parseIfNumber(totalKmDriven),
      location,
      price: parseIfNumber(price),
      fuelType,
      owners,
    });

    const cropParams = {
      gravity: "auto", // Auto-detect best cropping area
      width: 1000, // Reduce resolution
      height: 1000, // Set height to ensure consistent dimensions
      crop: "fill", // Required for auto gravity
      quality: "auto:low", // Aggressive compression
    };

    const uploadResults = [];
    let thumbnailImg = "";
    if (req.files["thumbnail"]) {
      const file = req.files["thumbnail"][0];

      const result = await cloudinary.uploader.upload(file.path, {
        folder: "vehicles",
        resource_type: "image",
        format: "jpg",
        quality: "auto:low",
        transformation: cropParams,
      });
      thumbnailImg = result.secure_url;
    }

    try {
      if (files) {
        for (const file of files) {
          try {
            if (file.size > 5 * 1024 * 1024) {
              throw new Error(`File ${file.originalname} exceeds 5MB limit`);
            }

            const result = await cloudinary.uploader.upload(file.path, {
              folder: "vehicles",
              resource_type: "image",
              format: "jpg",
              quality: "auto:low",
              transformation: cropParams,
            });

            uploadResults.push(result.secure_url);

            fs.unlink(file.path, (err) => {
              if (err) console.error("Error deleting the file:", err);
            });
          } catch (error) {
            console.error("Error uploading file to Cloudinary:", error);
          }
        }
      }
    } catch (err) {
      res.json({
        message: err.message,
      });
    }

    thumbnailImg = uploadResults[0];
    let isVerified = req.agent?.isVerified;
    const item = await VehicleModel.create({
      ...data,
      assured: isVerified,
      images: uploadResults,
      thumbnail: thumbnailImg,
    });
    const updatedAgent = await Agent.findByIdAndUpdate(
      { _id: req.agent._id },
      {
        $push: {
          myVehicleAds: item._id,
        },
      },
      { new: true }
    );
    return res.status(201).json({
      data: item,
      message: "product added successfully",
    });
  } catch (error) {
    return res.status(400).json({
      message: error.message,
    });
  }
};

export const getVehicles = async (req, res) => {
  try {
    const vehicles = await VehicleModel.find();
    res.json({ message: "vechicles fetched successfully", data: vehicles });
  } catch (error) {
    return res.status(400).json({
      message: error.message,
    });
  }
};
export const getAgentVehicleAds = async (req, res) => {
  try {
    const { id } = req.params;
    const vehicles = await Agent.findById(id).populate("myVehicleAds");
    res.json({ message: "vechicles fetched successfully", data: vehicles });
  } catch (error) {
    return res.status(400).json({
      message: error.message,
    });
  }
};

export const getModelsByBrand = async (req, res) => {
  try {
    const brand = req.params.brand.toLowerCase();

    const ModelsByBrand = await VehicleModel.aggregate([
      { $match: { brand: brand } },
      { $group: { _id: "$model" } },
      { $project: { _id: 0, model: "$_id" } },
    ]);
    const modelNames = ModelsByBrand.reduce((acc, curr) => {
      acc.push(curr.model); // Add the model name to the accumulator
      return acc;
    }, []);
    console.log(ModelsByBrand);
    res.json({ message: "models. fetched successfully1", data: modelNames });
  } catch (error) {
    res.status(400).json({
      message: error.message,
    });
  }
};

export const getVehicleBrands = async (req, res) => {
  try {
    const brands = await VehicleModel.aggregate([
      { $group: { _id: "$ " } },
      { $project: { _id: 0, brand: "$_id" } },
    ]);
    const brandNames = brands.reduce((acc, curr) => {
      acc.push(curr.brand); // Add the model name to the accumulator
      return acc;
    }, []);

    console.log(brands);
    res.json({ message: "brands fetched successfully1", data: brandNames });
  } catch (error) {
    res.status(400).json({
      message: error.message,
    });
  }
};

export const filterData = async (req, res) => {
  try {
    // Extract query parameters
    console.log("-----------------");
    const {
      brand,
      model,
      color,
      minPrice,
      maxPrice,
      // totalKmDriven,
      minKmDriven,
      maxKmDriven,
      minYear,
      maxYear,

      fuelType,
      owners,
      serialNo,
      transmission,
      seater,
    } = req.query;

    // Build the filter object dynamically
    const filter = {};
    console.log(">>>>>><<<<<<<<<");
    if (brand && brand != "undefined") filter.brand = brand;
    if (model && model != "undefined") filter.model = model;
    if (color && color != "undefined") filter.color = color;
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice); // Greater than or equal to minPrice
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice); // Less than or equal to maxPrice
    }
    if (minYear || maxYear) {
      filter.year = {};
      if (minYear) filter.year.$gte = parseFloat(minYear); // Greater than or equal to minPrice
      if (maxYear) filter.year.$lte = parseFloat(maxYear); // Less than or equal to maxPrice
    }
    if (minKmDriven || maxKmDriven) {
      filter.totalKmDriven = {};

      if (minKmDriven) filter.totalKmDriven.$gte = parseFloat(minKmDriven); // Less than or equal to totalKmDriven
      if (maxKmDriven) filter.totalKmDriven.$lte = parseFloat(maxKmDriven); // Less than or equal to totalKmDriven
    }

    if (fuelType && fuelType != "undefined") filter.fuelType = fuelType;
    if (owners && owners != "undefined") filter.owners = owners;
    if (transmission && transmission != "undefined")
      filter.transmission = transmission;
    if (seater && seater != "undefined") filter.seater = seater;
    if (serialNo && serialNo != "undefined") filter.serialNo = serialNo;
    console.log(filter);
    // Fetch data based on the filter
    const cars = await VehicleModel.find(filter);

    return res.json({ data: cars, message: "cars fetched successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const vehicleDetails = async (req, res) => {
  try {
    const { slug } = req.params;

    const car = await VehicleModel.findOne({ slug });

    return res.json({ data: car, message: "car details fetched successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
export const searchVehicles = async (req, res) => {
  try {
    // Extract query parameters
    const { search } = req.params;
    console.log(search);
    const isNumericSearch = !isNaN(search);
    // Build the filter object dynamically
    if (search && search !== "undefined" && search.length >= 3) {
      const regex = { $regex: search, $options: "i" };

      const filter = {
        $or: [
          { brand: regex },
          { model: regex },
          { serialNo: regex },
          { name: regex },
          // { price: regex },
          ...(isNumericSearch ? [{ price: Number(search) }] : []),
          ...(isNumericSearch ? [{ year: Number(search) }] : []),
        ],
      };

      const cars = await VehicleModel.find(filter);
      if (cars.length == 0) {
        return res.status(404).json({ error: "no vehicles present" });
      } else {
        return res.json({ data: cars, message: "cars fetched successfully" });
      }
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getVehicleDetails = async (req, res) => {
  try {
    const { vehicleSlug } = req.params;
    const vehicles = await VehicleModel.find();
    res.json({ message: "vechicles fetched successfully", data: vehicles });
  } catch (error) {
    return res.status(400).json({
      message: error.message,
    });
  }
};
