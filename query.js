const mongoose = require('mongoose');
const Sale = require('./Models/SaleModel');

async function seedSales() {
  try {
    await mongoose.connect('mongodb+srv://callsid:ILoveCellestial@cluster0.8atyypf.mongodb.net/crm?retryWrites=true&w=majority&appName=CRM', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const sales = [
      {
        clientId: "38",
        currentStatus: "New",
        approvalStatus: "Pending",
        leaseApprovalStatus: "Pending"
      }
    ];

    const result = await Sale.insertMany(sales);
    console.log("Inserted sales:", result);

    mongoose.connection.close();
  } catch (err) {
    console.error("Error inserting sales:", err);
  }
}

seedSales();