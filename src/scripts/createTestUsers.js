import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });

// Import models
import { Admin } from "../models/admin.js";
import { Agent } from "../models/agent.js";
import { Customer } from "../models/customer.js";

const MONGO_URI = process.env.MONGO_URI;
const DB_NAME = process.env.DB_NAME || "cars24";

const testUsers = {
  admin: {
    name: "Admin User",
    email: "admin@karlo.com",
    password: "Admin@123",
    phoneNumber: "9999999999",
  },
  agent: {
    name: "Agent User",
    email: "agent@karlo.com",
    password: "Agent@123",
    phoneNumber: "8888888888",
    address: "Bhopal, MP",
  },
  customer: {
    name: "Customer User",
    email: "customer@karlo.com",
    password: "Customer@123",
    phoneNumber: "7777777777",
  },
};

async function createTestUsers() {
  try {
    await mongoose.connect(MONGO_URI, { dbName: DB_NAME });
    console.log("Connected to MongoDB:", DB_NAME);

    // Create Admin
    const existingAdmin = await Admin.findOne({ email: testUsers.admin.email });
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash(testUsers.admin.password, 10);
      await Admin.create({
        ...testUsers.admin,
        password: hashedPassword,
        avatar: `https://ui-avatars.com/api/?name=${testUsers.admin.name}&background=16a34a&color=fff`,
      });
      console.log("✅ Admin created: admin@karlo.com / Admin@123");
    } else {
      console.log("⚠️ Admin already exists: admin@karlo.com / Admin@123");
    }

    // Create Agent
    const existingAgent = await Agent.findOne({ email: testUsers.agent.email });
    if (!existingAgent) {
      const hashedPassword = await bcrypt.hash(testUsers.agent.password, 10);
      await Agent.create({
        ...testUsers.agent,
        password: hashedPassword,
        avatar: `https://ui-avatars.com/api/?name=${testUsers.agent.name}&background=16a34a&color=fff`,
        status: "verified",
      });
      console.log("✅ Agent created: agent@karlo.com / Agent@123");
    } else {
      console.log("⚠️ Agent already exists: agent@karlo.com / Agent@123");
    }

    // Create Customer
    const existingCustomer = await Customer.findOne({ email: testUsers.customer.email });
    if (!existingCustomer) {
      const hashedPassword = await bcrypt.hash(testUsers.customer.password, 10);
      await Customer.create({
        ...testUsers.customer,
        password: hashedPassword,
        avatar: `https://ui-avatars.com/api/?name=${testUsers.customer.name}&background=16a34a&color=fff`,
      });
      console.log("✅ Customer created: customer@karlo.com / Customer@123");
    } else {
      console.log("⚠️ Customer already exists: customer@karlo.com / Customer@123");
    }

    console.log("\n========================================");
    console.log("TEST CREDENTIALS:");
    console.log("========================================");
    console.log("ADMIN:    admin@karlo.com    / Admin@123");
    console.log("AGENT:    agent@karlo.com    / Agent@123");
    console.log("CUSTOMER: customer@karlo.com / Customer@123");
    console.log("========================================\n");

    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
    process.exit(0);
  } catch (error) {
    console.error("Error creating test users:", error);
    process.exit(1);
  }
}

createTestUsers();
