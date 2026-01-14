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

const usersToSeed = [
    {
        role: "admin",
        model: Admin,
        data: {
            name: "Karlo Admin",
            email: "karlo@admin.com",
            password: "Deadpool@123",
            phoneNumber: "9999999991",
            address: "Karlo HQ",
            role: "admin"
        }
    },
    {
        role: "agent",
        model: Agent,
        data: {
            name: "Karlo Agent",
            email: "karlo@agent.com",
            password: "Deadpool@123",
            phoneNumber: "9999999992",
            isVerified: true,
            role: "agent"
        }
    },
    {
        role: "customer",
        model: Customer,
        data: {
            name: "Karlo User",
            email: "karlo@user.com",
            password: "Deadpool@123",
            phoneNumber: "9999999993",
            address: "User Address",
            role: "customer"
        }
    }
];

async function seedKarloUsers() {
    try {
        if (!MONGO_URI) {
            throw new Error("MONGO_URI is not defined in .env");
        }

        await mongoose.connect(MONGO_URI, { dbName: DB_NAME });
        console.log("Connected to MongoDB:", DB_NAME);

        for (const user of usersToSeed) {
            const hashedPassword = await bcrypt.hash(user.data.password, 10);
            const avatar = `https://ui-avatars.com/api/?name=${user.data.name}&background=random`;
            
            let existingUser = await user.model.findOne({ email: user.data.email });
            
            if (!existingUser) {
                await user.model.create({
                    ...user.data,
                    password: hashedPassword,
                    avatar: avatar
                });
                console.log(`✅ ${user.role} created successfully: ${user.data.email}`);
            } else {
                console.log(`⚠️ ${user.role} already exists: ${user.data.email}`);
                existingUser.password = hashedPassword;
                if (user.role === 'agent') {
                    existingUser.isVerified = true;
                }
                await existingUser.save();
                console.log(`   -> Password updated for ${user.role}`);
            }
        }

        console.log("\n============================================");
        console.log("Seeding Completed Successfully");
        console.log("============================================");

        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error("Error seeding users:", error);
        process.exit(1);
    }
}

seedKarloUsers();
