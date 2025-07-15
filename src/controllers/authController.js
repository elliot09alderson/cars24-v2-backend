import { Customer } from "../models/customer.js";
import bcrypt from "bcryptjs";
import { z } from "zod";
import jwt from "jsonwebtoken";
import { encryptToken } from "../utils/crypto.js";
import { generateAccessToken, generateRefreshToken } from "../utils/token.js";
import { Admin } from "../models/admin.js";
import { Agent } from "../models/agent.js";
const customerLoginSchema = z.object({
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long" }),
  email: z.string().email({ message: "Invalid email format" }),
});
const agentLoginSchema = z.object({
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long" }),
  email: z.string().email({ message: "Invalid email format" }),
});
const adminLoginSchema = z.object({
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long" }),
  email: z.string().email({ message: "Invalid email format" }),
});

export const checkAuth = async (req, res) => {
  try {
    console.log(req.user);
    const user = req.user;
    res.status(200).json({ message: "user verified ", data: user });
  } catch (error) {
    console.log(error.message);
  }
};
export const customerLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(email, password);
    const parsed = customerLoginSchema.safeParse({
      email,
      password,
    });

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: parsed.error.errors.map((err) => ({
          path: err.path,
          message: err.message,
        })),
      });
    }

    const isPresent = await Customer.findOne({
      email: parsed.data.email,
    }).select("+password");

    console.log(isPresent);
    if (!isPresent) {
      return res.status(400).json({ error: "not present" });
    }

    console.log(parsed.data.password, isPresent.password);
    const matched = await bcrypt.compare(
      parsed.data.password,
      isPresent.password
    );

    if (matched) {
      const expiryDuration = 24 * 60 * 60 * 1000; // 1 day in milliseconds
      let oldtoken = await generateAccessToken({
        email: isPresent.email,
        id: isPresent._id,
        role: isPresent.role || "customer",
      });

      const token = await encryptToken(oldtoken, process.env.SECRET_KEY);

      isPresent.token = oldtoken;
      isPresent.tokenExpiry = new Date(Date.now() + expiryDuration);
      await isPresent.save();

      return res
        .status(200)
        .cookie("customerToken", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production", // Use secure cookies in production
          sameSite: "Strict",
          sameSite: "lax",
          maxAge: 1000 * 60 * 60 * 24, // 1 day
        })
        .json({
          message: "logged in successfully",
          token,
          isPresent,
        });
    } else {
      return res.status(400).json({ error: "invalid credential" });
    }
  } catch (error) {
    console.error("Error during customer login:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
export const customerLogout = async (req, res) => {
  try {
    res.clearCookie("customerToken", { httpOnly: true, secure: true });
    res.clearCookie("agentToken", { httpOnly: true, secure: true });
    res.clearCookie("adminToken", { httpOnly: true, secure: true });

    return res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Error during customer logout:", error);

    return res.status(500).json({ error: "Internal server error" });
  }
};

export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const parsed = adminLoginSchema.safeParse({
      email,
      password,
    });

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: parsed.error.errors.map((err) => ({
          path: err.path,
          message: err.message,
        })),
      });
    }

    const isPresent = await Admin.findOne({
      email: parsed.data.email,
    }).select("+password");

    if (!isPresent) {
      return res.status(400).json({ error: "Admin not found" });
    }

    const matched = await bcrypt.compare(
      parsed.data.password,
      isPresent.password
    );

    if (matched) {
      const expiryDuration = 24 * 60 * 60 * 1000; // 1 day in milliseconds
      let oldtoken = await jwt.sign(
        {
          email: isPresent.email,
          id: isPresent._id,
          role: "admin",
        },
        process.env.JWT_SECRET,
        { expiresIn: "1d" } // Set token expiration
      );

      const token = await encryptToken(oldtoken, process.env.SECRET_KEY);

      isPresent.token = oldtoken; // Assuming the Admin model has a `token` field
      isPresent.tokenExpiry = new Date(Date.now() + expiryDuration);
      await isPresent.save();

      return res
        .status(200)
        .cookie("adminToken", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production", // Use secure cookies in production
          sameSite: "lax",
          maxAge: 1000 * 60 * 60 * 24, // 1 day
        })
        .json({
          message: "Logged in successfully",
          token,
          admin: isPresent,
        });
    } else {
      return res.status(400).json({ message: "Invalid credentials" });
    }
  } catch (error) {
    console.error("Error during admin login:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const adminLogout = async (req, res) => {
  try {
    res.clearCookie("adminToken", { httpOnly: true, secure: true });

    res.clearCookie("customerToken", { httpOnly: true, secure: true });

    // Respond with a success message
    return res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Error during agent logout:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const agentLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const parsed = agentLoginSchema.safeParse({
      email,
      password,
    });

    console.log(email, password);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: parsed.error.errors.map((err) => ({
          path: err.path,
          message: err.message,
        })),
      });
    }

    const isPresent = await Agent.findOne({
      email: parsed.data.email,
    }).select("+password");

    if (!isPresent) {
      console.log("email not found");
      return res.status(400).json({ error: "invalid email or password" });
    }

    const matched = await bcrypt.compare(
      parsed.data.password,
      isPresent.password
    );

    if (!matched) {
      return res.status(400).json({ error: "invalid email or password" });
    }

    if (matched) {
      const accessToken = await generateAccessToken({
        email: isPresent.email,
        id: isPresent._id,
        role: isPresent.role,
      });
      console.log(process.env.JWT_SECRET);

      const encryptedToken = await encryptToken(
        accessToken,
        process.env.SECRET_KEY
      );

      isPresent.token = accessToken;
      isPresent.tokenExpiry = Date.now() + 7 * 24 * 60 * 60 * 1000;

      await isPresent.save();

      const agent = await Agent.findById(isPresent._id).select("-password ");

      return res
        .status(200)
        .cookie("agentToken", encryptedToken, {
          httpOnly: true, // Prevents client-side JavaScript access
          secure: process.env.NODE_ENV === "production", // Ensure cookies are only sent over HTTPS in production
          sameSite: "lax", // Required for cross-origin requests
          maxAge: 1000 * 60 * 60 * 24, // 1 day
        })
        .json({
          message: "logged in successfully",
          encryptedToken,
          data: agent,
        });
    }
  } catch (error) {
    console.error("Error during customer login:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
export const agentLogout = async (req, res) => {
  try {
    res.clearCookie("agentToken", { httpOnly: true, secure: true });
    res.clearCookie("customerToken", { httpOnly: true, secure: true });
    res.clearCookie("agentToken", { httpOnly: true, secure: true });

    // Respond with a success message
    return res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Error during agent logout:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
