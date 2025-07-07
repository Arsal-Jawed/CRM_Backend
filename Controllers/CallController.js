const Call = require('../Models/CallModel');
const db = require('../db');

const createCall = async (req, res) => {
  try {
    const { clientId, date, caller, remarks } = req.body;
    const newCall = new Call({ clientId, date, caller, remarks });
    await newCall.save();

    const detail = `Scheduled a call on ${date} with remarks: ${remarks}`;
    const query = `INSERT INTO notification (notifier, detail, date) VALUES (?, ?, NOW())`;
    db.query(query, [caller, detail], (err) => {
      if (err) console.error('Failed to insert notification:', err);
    });

    res.status(201).json(newCall);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create call' });
  }
};


const getAllCalls = async (req, res) => {
  try {
    const calls = await Call.find().sort({ date: -1 });
    res.status(200).json(calls);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch calls' });
  }
};

const getCallsByClientId = async (req, res) => {
  try {
    const calls = await Call.find({ clientId: req.params.clientId }).sort({ date: -1 });
    res.status(200).json(calls);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch calls by clientId' });
  }
};

const getCallsByCaller = async (req, res) => {
  try {
    const calls = await Call.find({ caller: req.params.caller }).sort({ date: -1 });
    res.status(200).json(calls);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch calls by caller' });
  }
};

const getCallsByCallerAndClientId = async (req, res) => {
  try {
    const { caller, clientId } = req.params;
    const calls = await Call.find({ caller, clientId }).sort({ date: -1 });
    res.status(200).json(calls);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch calls by caller and clientId' });
  }
};

const getCallsByDate = async (req, res) => {
  try {
    const { date } = req.params;
    const calls = await Call.find({
      date: {
        $gte: new Date(date + 'T00:00:00.000Z'),
        $lte: new Date(date + 'T23:59:59.999Z')
      }
    }).sort({ date: -1 });
    res.status(200).json(calls);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch calls by date' });
  }
};

const editRemarks = async (req, res) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;

    const call = await Call.findById(id);
    if (!call) return res.status(404).json({ error: 'Call not found' });

    const updatedCall = await Call.findByIdAndUpdate(
      id,
      { remarks },
      { new: true }
    );

    const detail = `Updated call remarks to: ${remarks}`;
    const query = `INSERT INTO notification (notifier, detail, date) VALUES (?, ?, NOW())`;
    db.query(query, [call.caller, detail], (err) => {
      if (err) console.error('Failed to insert notification:', err);
    });

    res.status(200).json(updatedCall);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update remarks' });
  }
};


module.exports = {
  createCall,
  getAllCalls,
  getCallsByClientId,
  getCallsByCaller,
  getCallsByCallerAndClientId,
  getCallsByDate,
  editRemarks
};