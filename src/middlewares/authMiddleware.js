import jwt, { decode } from "jsonwebtoken";
import { Customer } from "../models/customer.js";
import { decryptToken } from "../utils/crypto.js";
import { generateAccessToken } from "../utils/token.js";
import { Admin } from "../models/admin.js";
import { Agent } from "../models/agent.js";

class AuthMiddleware {
  customerMiddleware = async (req, res, next) => {
    try {
      console.log(req.cookies);
      const token = req.cookies.customerToken || req.headers.Authorization;
      if (!token) {
        return res
          .status(401)
          .json({ error: "Unauthorized: No token provided" });
      }

      // Decode the token
      const decToken = await decryptToken(token, process.env.SECRET_KEY);

      const decoded = jwt.verify(decToken, process.env.JWT_SECRET);
      //  console.log(decoded)

      // Find the customer and check token and expiry
      const customer = await Customer.findOne({
        _id: decoded._id,
        token: decToken,
      }).select("-password ");

      // console.log(customer)

      if (!customer) {
        return res.status(401).json({ error: "Unauthorized: Invalid token" });
      }

      // Check if token is expired
      if (new Date() > customer.tokenExpiry) {
        return res.status(401).json({ error: "Unauthorized: Token expired" });
      } else {
        // Token is still valid
        res.status(200);
      }

      // Attach customer info to the request
      req.customer = customer;
      // console.log(req.customer)
      next();
    } catch (error) {
      console.error("Error in authMiddleware:", error);
      return res.status(401).json({ error: "Unauthorized" });
    }
  };

  commonMiddleware = async (req, res, next) => {
    try {
      console.log(req.cookies);
      const token =
        req.cookies.adminToken ||
        req.cookies.customerToken ||
        req.cookies.agentToken ||
        req.headers.Authorization;
      if (!token) {
        return res
          .status(401)
          .json({ error: "Unauthorized: No token provided" });
      }

      // Decode the token
      const decToken = decryptToken(token, process.env.SECRET_KEY);
      console.log(process.env.JWT_SECRET);
      const decoded = jwt.verify(decToken, process.env.JWT_SECRET);
      console.log(decoded);

      if (!decoded) {
        return res
          .status(403)
          .json({ message: "Invalid or expired refresh token" });
      }
      let user;
      if (decoded.role == "admin") {
        user = await Admin.findOne({
          _id: decoded.id,
          token: decToken,
        }).select("-password");
      } else if (decoded.role == "agent") {
        user = await Agent.findOne({
          _id: decoded.id,
          token: decToken,
        }).select("-password");
      } else {
        user = await Customer.findOne({
          _id: decoded.id,
          token: decToken,
        }).select("-password");
      }

      if (!user) {
        return res.status(401).json({ error: "Unauthorized: Invalid token" });
      }

      if (new Date() > user.tokenExpiry) {
        return res.status(401).json({ error: "Unauthorized: Token expired" });
      }

      req.user = user;
      console.log("passed");
      next();
    } catch (error) {
      // res.clearCookie("agentToken", {
      //   path: "/",
      //   httpOnly: true,
      //   secure: true,
      //   sameSite: "Strict",
      // });
      // res.clearCookie("adminToken", {
      //   path: "/",
      //   httpOnly: true,
      //   secure: true,
      //   sameSite: "Strict",
      // });
      // res.clearCookie("customerToken", {
      //   path: "/",
      //   httpOnly: true,
      //   secure: true,
      //   sameSite: "Strict",
      // });
      console.error("Error in authMiddleware:", error.message);
      return res.status(401).json({ error: error.message });
    }
  };
  adminMiddleware = async (req, res, next) => {
    try {
      const token = req.cookies.adminToken || req.headers.Authorization;

      if (!token) {
        return res
          .status(401)
          .json({ error: "Unauthorized: No token provided" });
      }

      // Decode the token
      const decToken = await decryptToken(token, process.env.SECRET_KEY);

      const decoded = jwt.verify(decToken, process.env.JWT_SECRET);
      //  console.log(decoded)

      // Find the customer and check token and expiry
      const admin = await Admin.findOne({
        _id: decoded._id,
        token: decToken,
      }).select("-password ");

      // console.log(customer)

      if (!admin) {
        return res.status(401).json({ error: "Unauthorized: Invalid token" });
      }

      // Check if token is expired
      if (new Date() > admin.tokenExpiry) {
        return res.status(401).json({ error: "Unauthorized: Token expired" });
      } else {
        // Token is still valid
        res.status(200);
      }

      // Attach customer info to the request
      req.admin = admin;
      // console.log(req.customer)
      next();
    } catch (error) {
      console.error("Error in authMiddleware:", error);
      return res.status(401).json({ error: "Unauthorized" });
    }
  };
  agentMiddleware = async (req, res, next) => {
    try {
      console.log(req.cookies);
      const token = req.cookies.agentToken || req.headers.Authorization;

      if (!token) {
        return res
          .status(401)
          .json({ error: "Unauthorized: No token provided" });
      }

      // Decode the token
      const decToken = decryptToken(token, process.env.SECRET_KEY);

      const decoded = jwt.verify(decToken, process.env.JWT_SECRET);

      if (!decoded) {
        return res
          .status(403)
          .json({ message: "Invalid or expired refresh token" });
      }

      const agent = await Agent.findOne({
        _id: decoded.id,
        token: decToken,
      }).select("-password");

      if (!agent) {
        return res.status(401).json({ error: "Unauthorized: Invalid token" });
      }

      if (new Date() > agent.tokenExpiry) {
        return res.status(401).json({ error: "Unauthorized: Token expired" });
      }

      req.agent = agent;
      console.log("passed");
      next();
    } catch (error) {
      console.error("Error in authMiddleware:", error.message);
      return res.status(401).json({ error: "Unauthorized" });
    }
  };
}

export const authMiddleware = new AuthMiddleware();
