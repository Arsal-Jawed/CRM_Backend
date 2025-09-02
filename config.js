const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const username = process.env.MongoDB_username;
const password = process.env.password;
const connectionAPI = `mongodb+srv://${username}:${password}@cluster0.8atyypf.mongodb.net/crm?retryWrites=true&w=majority&appName=CRM`;

const connectDB = async () => {
  try {
    await mongoose.connect(connectionAPI, {
      maxPoolSize: 10, // Prevents too many open sockets
      serverSelectionTimeoutMS: 5000, // Fail fast if can't connect
      socketTimeoutMS: 45000, // Close idle sockets
    });
    console.log("✅ Connected to MongoDB Atlas");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);
    // Retry after 5 seconds
    setTimeout(connectDB, 5000);
  }
};

module.exports = connectDB;