import { Customer } from "../models/customer.js";
import { VehicleModel as Vehicle } from "../models/vehicle.js";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import { Requirement } from "../models/requirement.js";

// Update profile schema
const updateProfileSchema = z.object({
  name: z.string().min(3, { message: "Name must be at least 3 characters" }).optional(),
  address: z.string().optional(),
  phoneNumber: z
    .string()
    .regex(/^\d{10}$/, { message: "Phone number must be exactly 10 digits" })
    .optional(),
});

const customerSchema = z.object({
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
const requirementSchema = z.object({
  vehicle: z.string().min(3, { message: "Vechile Model is required" }),
  from: z.string().optional(),
  to: z.string().optional(),
  budget: z.number().optional(), // Address is optional
  description: z.string(),
  phoneNumber: z
    .string()
    .regex(/^\d{10}$/, { message: "Phone number must be exactly 10 digits" })
    .optional(),
});

export async function createCustomer(req, res) {
  const { name, email, password, address, phoneNumber } = req.body;

  const parsed = customerSchema.safeParse({
    name,
    email,
    password,
    address,
    phoneNumber,
  });
  const isPresent = await Customer.findOne({
    $or: [{ email }, { phoneNumber }],
  });

  if (isPresent) {
    return res
      .status(409)
      .json({ error: "Email or phone number already exists" });
  }

  let file = req.file;
  console.log(file);

  const cropParams = {
    gravity: "auto",
    width: 300,
    height: 300,
    crop: "crop",
  };

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
        error: "invalid input",
      });
    }

    const encryptedPass = await bcrypt.hash(parsed.data.password, 10);

    parsed.data.password = encryptedPass;

    const customer = await Customer.create({
      ...parsed.data,
      avatar: result.url || "",
    });

    if (customer) {
      return res.status(201).json({
        success: true,
        message: "customer registered successfully",
        customer,
      });
    }
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}
export async function createRequirement(req, res) {
  try {
    console.log("body =======>>>", req.body);
    const { fromDate, carModel, toDate, budget, description, phoneNumber } =
      req.body;

    const to = toDate;
    const from = fromDate;
    const vehicle = carModel;
    const number = phoneNumber.toString();
    const parsed = requirementSchema.safeParse({
      vehicle,
      from,
      to,
      budget,
      description,
      phoneNumber: number,
    });

    if (!parsed.success) {
      console.error("Validation Error ===>", parsed.error);
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: parsed.error.format(),
      });
    }

    const requirement = await Requirement.create(parsed.data);

    return res.status(201).json({
      success: true,
      message: "Requirement registered successfully",
      data: requirement,
    });
  } catch (error) {
    console.error("Server Error ===>", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
}

// Get customer profile
export async function getProfile(req, res) {
  try {
    const customer = await Customer.findById(req.customer._id)
      .select("-password -token -tokenExpiry -resetPasswordToken -resetPasswordExpiry")
      .populate({
        path: "wishlist",
        select: "name model price images slug location year fuelType transmission totalKmDriven",
      });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    return res.status(200).json({
      success: true,
      customer,
    });
  } catch (error) {
    console.error("Get Profile Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
}

// Update customer profile
export async function updateProfile(req, res) {
  try {
    const { name, address, phoneNumber } = req.body;

    const parsed = updateProfileSchema.safeParse({ name, address, phoneNumber });

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: parsed.error.format(),
      });
    }

    // Check if phone number is already taken by another user
    if (phoneNumber) {
      const existingCustomer = await Customer.findOne({
        phoneNumber,
        _id: { $ne: req.customer._id },
      });

      if (existingCustomer) {
        return res.status(409).json({
          success: false,
          message: "Phone number already in use",
        });
      }
    }

    // Handle avatar upload if file is provided
    let avatarUrl = req.customer.avatar;
    if (req.file) {
      const cropParams = {
        gravity: "auto",
        width: 300,
        height: 300,
        crop: "crop",
      };

      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "cars24",
        resource_type: "raw",
        transformation: cropParams,
      });

      avatarUrl = result.url;

      // Delete temp file
      fs.unlink(req.file.path, (err) => {
        if (err) console.error("Error deleting temp file:", err);
      });
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (address) updateData.address = address;
    if (phoneNumber) updateData.phoneNumber = phoneNumber;
    if (avatarUrl !== req.customer.avatar) updateData.avatar = avatarUrl;

    const updatedCustomer = await Customer.findByIdAndUpdate(
      req.customer._id,
      updateData,
      { new: true }
    ).select("-password -token -tokenExpiry -resetPasswordToken -resetPasswordExpiry");

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      customer: updatedCustomer,
    });
  } catch (error) {
    console.error("Update Profile Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
}

// Add to wishlist
export async function addToWishlist(req, res) {
  try {
    const { vehicleId } = req.body;

    if (!vehicleId) {
      return res.status(400).json({
        success: false,
        message: "Vehicle ID is required",
      });
    }

    // Check if vehicle exists
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found",
      });
    }

    // Check if already in wishlist
    const customer = await Customer.findById(req.customer._id);
    if (customer.wishlist.includes(vehicleId)) {
      return res.status(400).json({
        success: false,
        message: "Vehicle already in wishlist",
      });
    }

    // Add to wishlist
    await Customer.findByIdAndUpdate(req.customer._id, {
      $push: { wishlist: vehicleId },
    });

    return res.status(200).json({
      success: true,
      message: "Added to wishlist",
    });
  } catch (error) {
    console.error("Add to Wishlist Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
}

// Remove from wishlist
export async function removeFromWishlist(req, res) {
  try {
    const { vehicleId } = req.params;

    await Customer.findByIdAndUpdate(req.customer._id, {
      $pull: { wishlist: vehicleId },
    });

    return res.status(200).json({
      success: true,
      message: "Removed from wishlist",
    });
  } catch (error) {
    console.error("Remove from Wishlist Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
}

// Get wishlist
export async function getWishlist(req, res) {
  try {
    const customer = await Customer.findById(req.customer._id).populate({
      path: "wishlist",
      select: "name model price images slug location year fuelType transmission totalKmDriven assured",
    });

    return res.status(200).json({
      success: true,
      wishlist: customer.wishlist || [],
    });
  } catch (error) {
    console.error("Get Wishlist Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
}
