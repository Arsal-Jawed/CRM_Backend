const Data = require('../Models/DataModel');
const db = require('../db');

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

module.exports = {
  addData,
  getDataByUser,
  editData,
  deleteData,
  createSchedule
};
