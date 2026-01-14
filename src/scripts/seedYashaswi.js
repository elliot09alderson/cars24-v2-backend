import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars from src/.env
dotenv.config({ path: path.join(__dirname, "../.env") });

import { Admin } from "../models/admin.js";
import { Agent } from "../models/agent.js";
import { Customer } from "../models/customer.js";

const MONGO_URI = process.env.MONGO_URI;
const DB_NAME = process.env.DB_NAME || "cars24";

const targetUser = {
  name: "Yashaswi",
  email: "itsgeekyyashaswi@gmail.com",
  password: "yashaswi@123",
  phoneNumber: "9876543210", 
  address: "123 Main St, Tech City",
};

async function seedYashaswi() {
  try {
    if (!MONGO_URI) {
      throw new Error("MONGO_URI is not defined in .env");
    }

    await mongoose.connect(MONGO_URI, { dbName: DB_NAME });
    console.log("Connected to MongoDB:", DB_NAME);

    const hashedPassword = await bcrypt.hash(targetUser.password, 10);
    const avatar = `https://ui-avatars.com/api/?name=${targetUser.name}&background=random`;

    // ---------------------------------------------------------
    // 1. Seed Admin
    // ---------------------------------------------------------
    let admin = await Admin.findOne({ email: targetUser.email });
    if (!admin) {
      admin = await Admin.create({
        name: targetUser.name,
        email: targetUser.email,
        password: hashedPassword,
        phoneNumber: targetUser.phoneNumber,
        address: targetUser.address,
        avatar: avatar,
        role: "admin",
      });
      console.log("✅ Admin created successfully");
    } else {
      console.log("⚠️ Admin already exists");
      // Optional: update password to ensure it matches
      admin.password = hashedPassword;
      await admin.save();
      console.log("   -> Password updated for Admin");
    }

    // ---------------------------------------------------------
    // 2. Seed Agent
    // ---------------------------------------------------------
    let agent = await Agent.findOne({ email: targetUser.email });
    if (!agent) {
      agent = await Agent.create({
        name: targetUser.name,
        email: targetUser.email,
        password: hashedPassword,
        phoneNumber: targetUser.phoneNumber,
        avatar: avatar,
        isVerified: true,
        role: "agent",
      });
      console.log("✅ Agent created successfully");
    } else {
      console.log("⚠️ Agent already exists");
      agent.password = hashedPassword;
      // Ensure verified
      agent.isVerified = true;
      await agent.save();
      console.log("   -> Password/Verification updated for Agent");
    }

    // ---------------------------------------------------------
    // 3. Seed Customer
    // ---------------------------------------------------------
    let customer = await Customer.findOne({ email: targetUser.email });
    if (!customer) {
      customer = await Customer.create({
        name: targetUser.name,
        email: targetUser.email,
        password: hashedPassword,
        phoneNumber: targetUser.phoneNumber,
        address: targetUser.address,
        avatar: avatar,
        role: "customer",
      });
      console.log("✅ Customer created successfully");
    } else {
      console.log("⚠️ Customer already exists");
      customer.password = hashedPassword;
      await customer.save();
      console.log("   -> Password updated for Customer");
    }

    console.log("\n============================================");
    console.log("Seeding Completed");
    console.log(`User: ${targetUser.name}`);
    console.log(`Email: ${targetUser.email}`);
    console.log(`Password: ${targetUser.password}`);
    console.log("Roles: Admin, Agent, Customer");
    console.log("============================================");

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Error seeding user:", error);
    process.exit(1);
  }
}

seedYashaswi();
