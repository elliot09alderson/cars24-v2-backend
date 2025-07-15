import { Agent } from "../models/agent.js";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import { Document } from "../models/document.js";

const agentSchema = z.object({
  name: z.string().min(3, { message: "Name is required" }),
  email: z.string().email({ message: "Invalid email format" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long" }),
  phoneNumber: z
    .string()
    .regex(/^\d{10}$/, { message: "Phone number must be exactly 10 digits" }),
  whatsappNumber: z.string().optional(),
});

const optionalAgentSchema = z.object({
  name: z.string().optional(),
  email: z.string().email({ message: "Invalid email format" }).optional(),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long" })
    .optional(),
  address: z.string().optional(),
  phoneNumber: z
    .string()
    .regex(/^\d{10}$/, { message: "Phone number must be exactly 10 digits" })
    .optional(),
  image: z
    .object({
      mimetype: z.string().regex(/^image\/(jpeg|png|gif|webp)$/, {
        message: "Only JPEG, PNG, GIF, or WEBP images are allowed",
      }),
      size: z
        .number()
        .max(5 * 1024 * 1024, { message: "Image size must not exceed 5MB" }),
    })
    .optional(),
});

// Define the optional schema using Zod

export async function createAgent(req, res) {
  const { name, email, password, phoneNumber, whatsappNumber } = req.body;
  const parsed = agentSchema.safeParse({
    name,
    email,
    password,
    phoneNumber,
    whatsappNumber,
  });

  const adminId = "678cb4075bbe1dd554d9d3ca" || "678cb4075bbe1dd554d9d3ca"; // Ensure this is a valid ObjectId

  const isPresent = await Agent.findOne({
    email: parsed.data.email,
  }).select("-password");
  if (isPresent) {
    return res.json({ error: "Agent Already present", status: 409 });
  }
  const file = req.file;
  const cropParams = {
    gravity: "auto",
    width: 300,
    height: 300,
    crop: "crop",
  };
  console.log(name, email, password, phoneNumber, whatsappNumber);
  try {
    let result = "";
    if (file) {
      result = await cloudinary.uploader.upload(file?.path, {
        folder: "agents",
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

    const agent = await Agent.create({
      ...parsed.data,
      avatar: result?.url || "",
    });

    // Fixing the Admin Update issue
    // const adminUpdate = await Admin.findByIdAndUpdate(
    //   adminId,
    //   { $push: { agents: agent._id } }, // Corrected $push syntax
    //   { new: true }
    // );

    // if (!adminUpdate) {
    //   return res.status(500).json({ message: "Admin not found" });
    // }

    return res.status(201).json({
      success: true,
      message: "Agent registered successfully",
      agent,
    });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}
export async function getAgentDetails(req, res) {
  const agentId = req.agent._id;
  // console.log(agentId)

  try {
    // Validate if the agentId is provided
    if (!agentId) {
      return res.status(400).json({
        success: false,
        message: "Agent ID is required",
      });
    }

    // Fetch the agent details by ID
    const agent = await Agent.findById(agentId)
      .populate("connections", "name email phoneNumber")
      .populate("clients", "name email phoneNumber")
      .populate("documents")
      .populate("myFlatAds") // Populates myFlatAds
      .populate("myHomeAds") // Populates myHomeAds
      .populate("myShopAds") // Populates myShopAds
      .populate("myLandAds") // Populates myLandAds
      .select("-password");

    // If agent not found, return a 404 error
    if (!agent) {
      return res.status(404).json({
        success: false,
        message: "Agent not found",
      });
    }

    console.log(agent);

    // Return the agent details
    return res.status(200).json({
      success: true,
      message: "Agent details fetched successfully",
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

export async function editAgentDetails(req, res) {
  const agentId = req.agent._id;

  try {
    const { name, email, password, address, phoneNumber } = req.body;

    // Handle the optional image file
    let image = req.file
      ? {
          mimetype: req.file.mimetype,
          size: req.file.size,
          filepath: req.file.path, // Assuming you're using a library like `multer`
        }
      : undefined;

    // Parse and validate the input data using optionalCustomerSchema
    const parsed = optionalAgentSchema.safeParse({
      name,
      email,
      password,
      address,
      phoneNumber,
      image: image ? { mimetype: image.mimetype, size: image.size } : undefined,
    });

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        errors: parsed.error.errors.map((err) => ({
          path: err.path,
          message: err.message,
        })),
      });
    }

    // Process the image if provided
    let avatar = undefined;
    if (image) {
      const cropParams = {
        width: 300,
        height: 300,
        crop: "crop",
        gravity: "auto",
      };

      const result = await cloudinary.uploader.upload(image.filepath, {
        folder: "profile",
        transformation: cropParams,
      });

      avatar = result?.url;
    }

    // Update the customer data
    const updatedData = {
      ...parsed.data,
      avatar: avatar || undefined, // Only add avatar if a new image was uploaded
    };

    // Remove undefined fields to ensure only provided fields are updated
    Object.keys(updatedData).forEach(
      (key) => updatedData[key] === undefined && delete updatedData[key]
    );

    const updatedAgent = await Agent.findByIdAndUpdate(
      agentId, // Find customer by email
      { $set: updatedData }, // Update only provided fields
      { new: true, runValidators: true } // Return the updated document and validate updates
    );

    if (!updatedAgent) {
      return res.status(404).json({
        success: false,
        message: "agent not found",
      });
    }

    // Return success response
    return res.status(200).json({
      success: true,
      message: "agent data updated successfully",
      data: updatedAgent,
    });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

const documentOptionalSchema = z.object({
  agentId: z.string(),
  adhaarNumber: z.string().optional(),
  panNumber: z.string().optional(),
  licenceNumber: z.string().optional(),
  gstNumber: z.string().optional(),
});

export async function uploadAgentDocument(req, res) {
  const { id } = req.agent;

  const { adhaarNumber, panNumber, licenceNumber, gstNumber } = req.body;

  const parsed = documentOptionalSchema.safeParse({
    agentId: id,
    adhaarNumber,
    panNumber,
    licenceNumber,
    gstNumber,
  });

  const files = req.files; // Array of uploaded files
  // console.log("files ^^^^^^", files);

  // return res.send("asdadsasdadsads");
  const cropParams = {
    gravity: "auto",
    width: 300,
    height: 300,
    crop: "crop",
  };

  try {
    const uploadResults = [];
    // console.log(uploadResults)

    for (const fieldName in files) {
      const fileArray = files[fieldName]; // This is an array of files for the field
      // console.log(typeof fileArray, "this is filearra");
      if (fileArray.length > 0) {
        // Process the first file (since you only want to handle single files per field)
        const file = fileArray[0];
        // console.log(fieldName,"this is file")

        const result = await cloudinary.uploader.upload(file.path, {
          folder: "agents",
          resource_type: "raw",
          transformation: cropParams,
        });
        // console.log(result.secure_url);

        // Store the Cloudinary URL in the results array
        uploadResults.push({ field: fieldName, url: result.secure_url });

        // Delete the local file after uploading
        fs.unlink(file.path, (err) => {
          if (err) {
            console.error("Error deleting the file:", err);
          }
        });
      }
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

    const document = await Document.create({
      agentId: parsed.data.agentId,
      adhaar: parsed.data.adhaarNumber
        ? {
            number: parsed.data.adhaarNumber,
            adhaarImage: uploadResults.filter(
              (field) => field.field == "adhaarImage"
            )[0].url,
          }
        : undefined,
      pan: parsed.data.panNumber
        ? {
            number: parsed.data.panNumber,
            panImage: uploadResults.filter(
              (field) => field.field == "panImage"
            )[0].url,
          }
        : undefined,
      licence: parsed.data.licenceNumber
        ? {
            number: parsed.data.licenceNumber,
            licenceImage: uploadResults.filter(
              (field) => field.field == "licenceImage"
            )[0].url,
          }
        : undefined,
      gst: parsed.data.gstNumber
        ? {
            number: parsed.data.gstNumber,
            gstImage: uploadResults.filter(
              (field) => field.field == "gstImage"
            )[0].url,
          }
        : undefined,
    });

    // console.log(document);

    if (document) {
      return res.status(201).json({
        success: true,
        message: "Agent document add successfully",
        data: document,
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

export async function fetchAgentAds(req, res) {
  const agentId = req.agent._id;
  // console.log(agentId)

  try {
    // Validate if the agentId is provided
    if (!agentId) {
      return res.status(400).json({
        success: false,
        message: "Agent ID is required",
      });
    }

    // Fetch the agent details by ID
    const agent = await Agent.findById(agentId).populate("myVehicleAds");

    // If agent not found, return a 404 error
    if (!agent) {
      return res.status(404).json({
        success: false,
        message: "Agent not found",
      });
    }

    // Return the agent details
    return res.status(200).json({
      success: true,
      message: "Agent ads fetched successfully",
      data: agent.myVehicleAds,
    });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}
