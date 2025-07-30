const Sale = require('../Models/SaleModel');
const Lead = require('../Models/LeadModel');
const User = require('../Models/UserModel');

const createSale = async (req, res) => {
  try {
    const sale = new Sale(req.body);
    await sale.save();
    res.status(201).json(sale);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const updateApplicationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, email } = req.body;
    console.log('Application Status API Hit: '+status+email);

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found with given email' });

    const fullName = `${user.firstName} ${user.lastName}`;
    const updateFields = { currentStatus: status };
    const now = new Date();

    if (status === 'Submitted') {
      updateFields.submitDate = now;
      updateFields.submitBy = fullName;
    } else if (status === 'Approved' || status === 'Rejected') {
      updateFields.approvalStatus = status;
      updateFields.approveDate = now;
      updateFields.approveBy = fullName;
    } else if (status === 'Delivered') {
      updateFields.deliveredDate = now;
      updateFields.deliveredBy = fullName;
    } else if (status === 'Activated') {
      updateFields.activationDate = now;
      updateFields.activatedBy = fullName;
    }

    const sale = await Sale.findByIdAndUpdate(id, updateFields, { new: true });
    res.json(sale);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};


const updateLeaseStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, email } = req.body;
    console.log('Lease Status API hit: '+status+email);
    const updateFields = {};
    const now = new Date();

    if (status === 'Submitted') {
      const user = await User.findOne({ email });

      if (!user) {
        return res.status(404).json({ error: 'User not found with given email' });
      }

      const fullName = `${user.firstName} ${user.lastName}`;
      updateFields.leaseApprovalStatus = status;
      updateFields.leaseSubmitDate = now;
      updateFields.leaseSubmitBy = fullName;
    }

    if (status === 'Approved' || status === 'Rejected') {
      const user = await User.findOne({ email });
      const fullName = `${user.firstName} ${user.lastName}`;
      updateFields.leaseApprovalStatus = status;
      updateFields.leaseApprovalDate = now;
      updateFields.leaseApprovedBy = fullName;
    }

    const updatedSale = await Sale.findByIdAndUpdate(id, updateFields, { new: true });

    res.json(updatedSale);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const updateCreditScore = async (req, res) => {
  try {
    const { id } = req.params;
    const { score } = req.body;
    const sale = await Sale.findByIdAndUpdate(id, { creditScore: score }, { new: true });
    res.json(sale);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const getSales = async (req, res) => {
  try {
    const sales = await Sale.find();
    const leads = await Lead.find({ lead_id: { $in: sales.map(s => parseInt(s.clientId)) } });

    const leadMap = {};
    for (let lead of leads) {
      leadMap[lead.lead_id] = lead;
    }

    const combined = sales.map(sale => ({
      sale,
      lead: leadMap[parseInt(sale.clientId)] || null
    }));

    res.json(combined);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


const editSale = async (req, res) => {
  try {
    const saleId = req.params.id;
    const updates = req.body;

    const updatedSale = await Sale.findByIdAndUpdate(saleId, updates, { new: true });

    if (!updatedSale) {
      return res.status(404).json({ message: 'Sale not found' });
    }

    res.status(200).json(updatedSale);
  } catch (err) {
    console.error('Error updating sale:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

const getAllSales = async (req, res) => {
  try {
    const sales = await Sale.find();
    res.status(200).json(sales);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createSale,
  updateApplicationStatus,
  updateLeaseStatus,
  updateCreditScore,
  getSales,
  editSale,
  getAllSales
};