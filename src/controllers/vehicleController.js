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
      { $group: { _id: "$brand" } },
      { $project: { _id: 0, brand: "$_id" } },
      { $sort: { brand: 1 } },
    ]);
    const brandNames = brands.reduce((acc, curr) => {
      if (curr.brand) acc.push(curr.brand);
      return acc;
    }, []);

    res.json({ message: "brands fetched successfully", data: brandNames });
  } catch (error) {
    res.status(400).json({
      message: error.message,
    });
  }
};

export const filterData = async (req, res) => {
  try {
    const {
      brand,
      model,
      color,
      minPrice,
      maxPrice,
      minKmDriven,
      maxKmDriven,
      minYear,
      maxYear,
      fuelType,
      owners,
      serialNo,
      transmission,
      bodyType,
      seat,
      seater,
      assured,
      sortBy,
      sortOrder,
      page,
      limit,
      search,
    } = req.query;

    // Build the filter object dynamically
    const filter = {};

    // Text search across multiple fields
    if (search && search !== "undefined" && search.length >= 2) {
      const regex = { $regex: search, $options: "i" };
      filter.$or = [
        { brand: regex },
        { model: regex },
        { name: regex },
        { serialNo: regex },
        { location: regex },
      ];
    }

    // Handle brand - can be single value or comma-separated
    if (brand && brand !== "undefined") {
      const brands = brand.split(",").filter((b) => b.trim());
      if (brands.length === 1) {
        filter.brand = brands[0].toLowerCase();
      } else if (brands.length > 1) {
        filter.brand = { $in: brands.map((b) => b.toLowerCase()) };
      }
    }

    // Handle model - can be single value or comma-separated
    if (model && model !== "undefined") {
      const models = model.split(",").filter((m) => m.trim());
      if (models.length === 1) {
        filter.model = models[0].toLowerCase();
      } else if (models.length > 1) {
        filter.model = { $in: models.map((m) => m.toLowerCase()) };
      }
    }

    // Handle color - can be single value or comma-separated
    if (color && color !== "undefined") {
      const colors = color.split(",").filter((c) => c.trim());
      if (colors.length === 1) {
        filter.color = { $regex: colors[0], $options: "i" };
      } else if (colors.length > 1) {
        filter.color = {
          $in: colors.map((c) => new RegExp(c, "i")),
        };
      }
    }

    // Price range
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice && minPrice !== "undefined")
        filter.price.$gte = parseFloat(minPrice);
      if (maxPrice && maxPrice !== "undefined")
        filter.price.$lte = parseFloat(maxPrice);
    }

    // Year range
    if (minYear || maxYear) {
      filter.year = {};
      if (minYear && minYear !== "undefined")
        filter.year.$gte = parseInt(minYear);
      if (maxYear && maxYear !== "undefined")
        filter.year.$lte = parseInt(maxYear);
    }

    // KM driven range
    if (minKmDriven || maxKmDriven) {
      filter.totalKmDriven = {};
      if (minKmDriven && minKmDriven !== "undefined")
        filter.totalKmDriven.$gte = parseFloat(minKmDriven);
      if (maxKmDriven && maxKmDriven !== "undefined")
        filter.totalKmDriven.$lte = parseFloat(maxKmDriven);
    }

    // Handle fuelType - can be single value or comma-separated
    if (fuelType && fuelType !== "undefined") {
      const fuelTypes = fuelType.split(",").filter((f) => f.trim());
      if (fuelTypes.length === 1) {
        filter.fuelType = fuelTypes[0];
      } else if (fuelTypes.length > 1) {
        filter.fuelType = { $in: fuelTypes };
      }
    }

    // Handle owners - can be single value or comma-separated
    if (owners && owners !== "undefined") {
      const ownersList = owners.split(",").filter((o) => o.trim());
      if (ownersList.length === 1) {
        filter.owners = ownersList[0];
      } else if (ownersList.length > 1) {
        filter.owners = { $in: ownersList };
      }
    }

    // Handle transmission - can be single value or comma-separated
    if (transmission && transmission !== "undefined") {
      const transmissions = transmission.split(",").filter((t) => t.trim());
      if (transmissions.length === 1) {
        filter.transmission = transmissions[0].toLowerCase();
      } else if (transmissions.length > 1) {
        filter.transmission = { $in: transmissions.map((t) => t.toLowerCase()) };
      }
    }

    // Handle bodyType - can be single value or comma-separated
    if (bodyType && bodyType !== "undefined") {
      const bodyTypes = bodyType.split(",").filter((b) => b.trim());
      if (bodyTypes.length === 1) {
        filter.bodyType = bodyTypes[0].toLowerCase();
      } else if (bodyTypes.length > 1) {
        filter.bodyType = { $in: bodyTypes.map((b) => b.toLowerCase()) };
      }
    }

    // Handle seats - can be single value or comma-separated
    const seatValue = seat || seater;
    if (seatValue && seatValue !== "undefined") {
      const seats = seatValue.split(",").filter((s) => s.trim());
      if (seats.length === 1) {
        filter.seat = parseInt(seats[0]);
      } else if (seats.length > 1) {
        filter.seat = { $in: seats.map((s) => parseInt(s)) };
      }
    }

    if (serialNo && serialNo !== "undefined") filter.serialNo = serialNo;

    // Assured filter
    if (assured && assured !== "undefined") {
      filter.assured = assured === "true";
    }

    // Sorting
    let sort = { createdAt: -1 }; // Default sort by newest
    if (sortBy && sortBy !== "undefined") {
      const order = sortOrder === "asc" ? 1 : -1;
      switch (sortBy) {
        case "price":
          sort = { price: order };
          break;
        case "year":
          sort = { year: order };
          break;
        case "km":
          sort = { totalKmDriven: order };
          break;
        case "newest":
          sort = { createdAt: -1 };
          break;
        case "oldest":
          sort = { createdAt: 1 };
          break;
        default:
          sort = { createdAt: -1 };
      }
    }

    // Pagination
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 50;
    const skip = (pageNum - 1) * limitNum;

    // Execute query
    const [cars, totalCount] = await Promise.all([
      VehicleModel.find(filter).sort(sort).skip(skip).limit(limitNum),
      VehicleModel.countDocuments(filter),
    ]);

    return res.json({
      data: cars,
      message: "cars fetched successfully",
      pagination: {
        total: totalCount,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(totalCount / limitNum),
      },
    });
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
