import { Customer } from "../models/customer.js";
import bcrypt from "bcryptjs";
import { z } from "zod";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { encryptToken } from "../utils/crypto.js";
import { generateAccessToken, generateRefreshToken } from "../utils/token.js";
import { Admin } from "../models/admin.js";
import { Agent } from "../models/agent.js";
import {
  sendPasswordResetEmail,
  sendPasswordResetSuccessEmail,
} from "../utils/email.js";
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
          sameSite: "none",
          // sameSite: "lax",
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
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "none",
    };
    res.clearCookie("customerToken", cookieOptions);
    res.clearCookie("agentToken", cookieOptions);
    res.clearCookie("adminToken", cookieOptions);

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
          sameSite: "none",
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
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "none",
    };
    res.clearCookie("adminToken", cookieOptions);
    res.clearCookie("customerToken", cookieOptions);

    // Respond with a success message
    return res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Error during admin logout:", error);
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
          sameSite: "none", // Required for cross-origin requests
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
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "none",
    };
    res.clearCookie("agentToken", cookieOptions);
    res.clearCookie("customerToken", cookieOptions);
    res.clearCookie("adminToken", cookieOptions);

    // Respond with a success message
    return res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Error during agent logout:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Validation schemas for forgot/reset password
const forgotPasswordSchema = z.object({
  email: z.string().email({ message: "Invalid email format" }),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, { message: "Token is required" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long" }),
});

// Helper function to get model by user type
const getModelByUserType = (userType) => {
  switch (userType) {
    case "customer":
      return Customer;
    case "agent":
      return Agent;
    case "admin":
      return Admin;
    default:
      return null;
  }
};

// Forgot Password - sends reset email
export const forgotPassword = async (req, res) => {
  try {
    const { email, userType } = req.body;

    // Validate email
    const parsed = forgotPasswordSchema.safeParse({ email });
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: parsed.error.errors.map((err) => ({
          path: err.path,
          message: err.message,
        })),
      });
    }

    // Validate user type
    const validUserTypes = ["customer", "agent", "admin"];
    if (!userType || !validUserTypes.includes(userType)) {
      return res.status(400).json({
        success: false,
        error: "Invalid user type",
      });
    }

    const Model = getModelByUserType(userType);
    const user = await Model.findOne({ email: parsed.data.email });

    if (!user) {
      // Return success even if user not found (security best practice)
      return res.status(200).json({
        success: true,
        message: "If the email exists, a password reset link has been sent",
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // Save token and expiry to user
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    // Send reset email (non-blocking - added to queue)
    sendPasswordResetEmail(user.email, resetToken, userType);

    return res.status(200).json({
      success: true,
      message: "If the email exists, a password reset link has been sent",
    });
  } catch (error) {
    console.error("Error during forgot password:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

// Reset Password - validates token and updates password
export const resetPassword = async (req, res) => {
  try {
    const { token, password, userType } = req.body;

    // Validate input
    const parsed = resetPasswordSchema.safeParse({ token, password });
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: parsed.error.errors.map((err) => ({
          path: err.path,
          message: err.message,
        })),
      });
    }

    // Validate user type
    const validUserTypes = ["customer", "agent", "admin"];
    if (!userType || !validUserTypes.includes(userType)) {
      return res.status(400).json({
        success: false,
        error: "Invalid user type",
      });
    }

    // Hash the token to compare with stored hash
    const hashedToken = crypto
      .createHash("sha256")
      .update(parsed.data.token)
      .digest("hex");

    const Model = getModelByUserType(userType);
    const user = await Model.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpiry: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        error: "Invalid or expired reset token",
      });
    }

    // Hash new password and update
    const hashedPassword = await bcrypt.hash(parsed.data.password, 10);
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpiry = undefined;
    await user.save();

    // Send confirmation email (non-blocking - added to queue)
    sendPasswordResetSuccessEmail(user.email, user.name);

    return res.status(200).json({
      success: true,
      message: "Password reset successful",
    });
  } catch (error) {
    console.error("Error during password reset:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

// Verify Reset Token - checks if token is valid (optional endpoint)
export const verifyResetToken = async (req, res) => {
  try {
    const { token, userType } = req.params;

    // Validate user type
    const validUserTypes = ["customer", "agent", "admin"];
    if (!userType || !validUserTypes.includes(userType)) {
      return res.status(400).json({
        success: false,
        error: "Invalid user type",
      });
    }

    // Hash the token to compare with stored hash
    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const Model = getModelByUserType(userType);
    const user = await Model.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpiry: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        error: "Invalid or expired reset token",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Token is valid",
    });
  } catch (error) {
    console.error("Error verifying reset token:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};
