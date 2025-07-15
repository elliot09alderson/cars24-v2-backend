import { Customer } from "../models/customer.js";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import { Requirement } from "../models/requirement.js";

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
