import { Admin } from "../models/admin.js";
import { Agent } from "../models/agent.js";
import { Customer } from "../models/customer.js";
import { VehicleModel as Vehicle } from "../models/vehicle.js";
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

// Get all agents
export async function getAllAgents(req, res) {
  try {
    const { search, status } = req.query;

    // Build query filter
    let filter = {};

    // Search filter
    if (search && search !== "undefined" && search.length >= 2) {
      const regex = { $regex: search, $options: "i" };
      filter.$or = [
        { name: regex },
        { email: regex },
        { phoneNumber: regex },
        { address: regex },
      ];
    }

    // Status filter
    if (status && status !== "all") {
      filter.status = status;
    }

    const agents = await Agent.find(filter)
      .select("-password")
      .sort({ createdAt: -1 });

    // Get vehicle count for each agent
    const agentsWithStats = await Promise.all(
      agents.map(async (agent) => {
        const vehicleCount = await Vehicle.countDocuments({ agent: agent._id });
        return {
          ...agent.toObject(),
          totalAds: vehicleCount,
          soldCount: 0, // Placeholder - would need to track sold status
          activeAds: vehicleCount,
        };
      })
    );

    return res.status(200).json({
      success: true,
      message: "Agents fetched successfully",
      data: agentsWithStats,
    });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

// Get all customers
export async function getAllCustomers(req, res) {
  try {
    const customers = await Customer.find()
      .select("-password")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Customers fetched successfully",
      data: customers,
    });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

// Get dashboard stats
export async function getDashboardStats(req, res) {
  try {
    const [vehicleCount, agentCount, customerCount] = await Promise.all([
      Vehicle.countDocuments(),
      Agent.countDocuments(),
      Customer.countDocuments(),
    ]);

    // Get state-wise vehicle distribution
    const stateDistribution = await Vehicle.aggregate([
      {
        $group: {
          _id: "$state",
          count: { $sum: 1 },
        },
      },
    ]);

    // Get recent vehicles
    const recentVehicles = await Vehicle.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select("name model year price thumbnail images status slug");

    // Get monthly stats (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyStats = await Vehicle.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            month: { $month: "$createdAt" },
            year: { $year: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    return res.status(200).json({
      success: true,
      data: {
        totalVehicles: vehicleCount,
        totalAgents: agentCount,
        totalCustomers: customerCount,
        stateDistribution,
        recentVehicles,
        monthlyStats,
      },
    });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

// Update agent status
export async function updateAgentStatus(req, res) {
  const { agentId, status } = req.body;

  try {
    const agent = await Agent.findByIdAndUpdate(
      agentId,
      { status },
      { new: true }
    ).select("-password");

    if (!agent) {
      return res.status(404).json({
        success: false,
        error: "Agent not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: `Agent ${status} successfully`,
      data: agent,
    });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

// Update vehicle status
export async function updateVehicleStatus(req, res) {
  const { vehicleId, status } = req.body;

  try {
    const vehicle = await Vehicle.findByIdAndUpdate(
      vehicleId,
      { status },
      { new: true }
    );

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        error: "Vehicle not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: `Vehicle ${status} successfully`,
      data: vehicle,
    });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

// Delete vehicle
export async function deleteVehicle(req, res) {
  const { vehicleId } = req.params;

  try {
    const vehicle = await Vehicle.findByIdAndDelete(vehicleId);

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        error: "Vehicle not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Vehicle deleted successfully",
    });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}
