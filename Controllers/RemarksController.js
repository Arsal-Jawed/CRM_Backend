const Remark = require('../Models/RemarksModel');
const User = require('../Models/UserModel');

const addRemark = async (req, res) => {
  try {
    const { closure, leadGen, remark } = req.body;

    const closureUser = await User.findOne({ email: closure });
    const leadGenUser = await User.findOne({ email: leadGen });

    if (!closureUser || !leadGenUser)
      return res.status(404).json({ error: 'User(s) not found' });

    const newRemark = await Remark.create({ closure, leadGen, remark });

    const notifier = `${closureUser.firstName} ${closureUser.lastName}`;
    const leadGenName = `${leadGenUser.firstName} ${leadGenUser.lastName}`;
    const detail = `${notifier} gave remarks about ${leadGenName}`;

    const query = `INSERT INTO notification (notifier, detail, date) VALUES (?, ?, NOW())`;
    db.query(query, [notifier, detail], (err) => {
      if (err) console.error('Failed to insert notification:', err);
    });

    res.status(201).json(newRemark);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add remark' });
  }
};


const getRemarksByLeadGen = async (req, res) => {
  try {
    const { leadGen } = req.params;

    const remarks = await Remark.find({ leadGen });

    const closureEmails = [...new Set(remarks.map(r => r.closure))];

    const users = await User.find({ email: { $in: closureEmails } });

    const emailToNameMap = {};
    users.forEach(user => {
      emailToNameMap[user.email] = `${user.firstName} ${user.lastName}`;
    });

    const enrichedRemarks = remarks.map(remark => ({
      ...remark._doc,
      closureName: emailToNameMap[remark.closure] || remark.closure
    }));

    res.json(enrichedRemarks);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch remarks by leadGen' });
  }
};

const getAllRemarks = async (req, res) => {
  try {
    const remarks = await Remark.find();
    res.json(remarks);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch all remarks' });
  }
};

const getRemarksByClosure = async (req, res) => {
  try {
    const { closure } = req.params;
    const remarks = await Remark.find({ closure });
    res.json(remarks);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch remarks by closure' });
  }
};

module.exports = {
  addRemark,
  getRemarksByLeadGen,
  getAllRemarks,
  getRemarksByClosure
};