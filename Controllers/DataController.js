const Data = require('../Models/DataModel');
const db = require('../db');
const Sale = require("../Models/SaleModel");
const User = require("../Models/UserModel");
const Ticket = require("../Models/TicketModel");
const Equipment = require("../Models/Equipment");
const Lead = require("../Models/LeadModel");
const Doc = require("../Models/DocModel");

const addData = async (req, res) => {
  try {
    const {
      user,
      owner_name,
      business_name,
      business_contact,
      details,
      followupDate
    } = req.body;

    const newData = new Data({
      user,
      owner_name,
      business_name,
      business_contact,
      details,
      followupDate
    });

    const saved = await newData.save();
    res.json(saved);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add data' });
  }
};


// Get Data by User
const getDataByUser = async (req, res) => {
  try {
    const { email } = req.body;
    const data = await Data.find({ user: email });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch data' });
  }
};

// Edit Data
const editData = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await Data.findByIdAndUpdate(id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update data' });
  }
};

// Delete Data
const deleteData = async (req, res) => {
  try {
    const { id } = req.params;
    await Data.findByIdAndDelete(id);
    res.json({ message: 'Data deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete data' });
  }
};

// Create Schedule from Data
const createSchedule = async (req, res) => {
  try {
    const { scheduler, details, schedule_date, visibility = 'private' } = req.body;
    const query = `
      INSERT INTO schedules (scheduler, details, schedule_date, visibility)
      VALUES (?, ?, ?, ?)
    `;
    db.query(query, [scheduler, details, schedule_date, visibility], (err, result) => {
      if (err) return res.status(500).json({ error: 'Failed to create schedule' });
      res.json({ message: 'Schedule created', scheduleId: result.insertId });
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create schedule' });
  }
};

const getDashboardStats = async (req, res) => {
  try {
    // Tickets
    const totalTickets = await Ticket.countDocuments()
    const pendingTickets = await Ticket.countDocuments({ status: 'Pending' })

    // Sales / Clients
    const totalClients = await Sale.countDocuments()
    const pendingApprovals = await Sale.countDocuments({ approvalStatus: 'Pending' })
    const approvedApprovals = await Sale.countDocuments({ approvalStatus: 'Approved' })
    const submittedApprovals = await Sale.countDocuments({ approvalStatus: 'Submitted' })
    const activatedApprovals = await Sale.countDocuments({ approvalStatus: 'Activated' })
    const rejectedApprovals = await Sale.countDocuments({ approvalStatus: 'Rejected' })

    // Leads
    const totalLeads = await Lead.countDocuments()
    const wonLeads = await Lead.countDocuments({ status: 'won' })
    const lostLeads = await Lead.countDocuments({ status: 'lost' })
    const inProcessLeads = await Lead.countDocuments({ status: 'in process' })

    // Equipments
    const totalEquipments = await Equipment.countDocuments()
    const equipmentsAgg = await Equipment.aggregate([
      {
        $group: {
          _id: null,
          totalLeaseAmount: { $sum: { $toDouble: "$leaseAmount" } }
        }
      }
    ])
    const totalLeaseAmount = equipmentsAgg[0]?.totalLeaseAmount || 0
    
    // Documents
    const totalDocs = await Doc.countDocuments()

    // Users
    const totalUsers = await User.countDocuments()
    const managers = await User.countDocuments({ role: 1 })
    const opsExecs = await User.countDocuments({ role: { $in: [4, 5] } })
    const closures = await User.countDocuments({ role: 2 })
    const leadGens = await User.countDocuments({ role: 3 })

    res.json({
      tickets: { totalTickets, pendingTickets },
      sales: { totalClients, pendingApprovals, approvedApprovals, submittedApprovals, activatedApprovals, rejectedApprovals, totalDocs },
      leads: { totalLeads, wonLeads, lostLeads, inProcessLeads },
      equipments: { totalEquipments, totalLeaseAmount: Number(totalLeaseAmount) },
      users: { totalUsers, managers, opsExecs, closures, leadGens }
    })
  } catch (err) {
    console.error("Error fetching dashboard stats:", err)
    res.status(500).json({ error: "Server error fetching dashboard stats" })
  }
}

module.exports = {
  addData,
  getDataByUser,
  editData,
  deleteData,
  createSchedule,
  getDashboardStats
};
