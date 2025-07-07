const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const username = process.env.MongoDB_username;
const password = process.env.password;

const connectionAPI = `mongodb+srv://${username}:${password}@cluster0.8atyypf.mongodb.net/crm?retryWrites=true&w=majority&appName=CRM`;



const connectDB = async () => {
  try {
    await mongoose.connect(connectionAPI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB Atlas");
  } catch (error) {
    console.error("MongoDB connection error:", error);
  }
};

module.exports = connectDB;