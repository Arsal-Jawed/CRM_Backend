const mongoose = require('mongoose');
const Lead = require('./Models/LeadModel');

async function updateLeads() {
  try {
    await mongoose.connect('mongodb+srv://callsid:ILoveCellestial@cluster0.8atyypf.mongodb.net/crm?retryWrites=true&w=majority&appName=CRM', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // Dates are stored as strings, so we'll just match these exact values
    const dateRange = ["10/10/2025", "10/11/2025", "10/12/2025", "10/13/2025", "10/14/2025"];

    const result = await Lead.updateMany(
      {
        date: { $in: dateRange },
        closure1: "not specified",
        closure2: "not specified"
      },
      { $set: { status: "pending" } }
    );

    console.log(`✅ Updated ${result.modifiedCount} leads to status: pending`);
    await mongoose.connection.close();
  } catch (err) {
    console.error("❌ Error updating leads:", err);
  }
}

updateLeads();