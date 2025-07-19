const db = require('../db');
const moment = require('moment');
const User = require('../Models/UserModel');

const markAttendance = (req, res) => {
  const { email, remarks = '' } = req.body;
  const now = new Date();
  const currentDate = now.toISOString().slice(0, 10);
  const checkIn = now.toTimeString().slice(0, 8);

  const start = new Date();
  start.setHours(9, 0, 0);

  const late = new Date();
  late.setHours(9, 35, 0);

  // const end = new Date();
  // end.setHours(11, 45, 0);

  if (now < start || now > end) {
    return res.status(200).json({ message: 'Attendance window closed' });
  }

  const status = now < late ? 'Present' : 'Late';

  const checkQuery = `SELECT * FROM attendance WHERE user_email = ? AND date = ?`;

  db.query(checkQuery, [email, currentDate], (err, rows) => {
    if (err) return res.status(500).json({ message: 'Database error' });

    if (rows.length > 0) {
      return res.status(400).json({ message: 'Attendance already marked for today' });
    }

    const insertQuery = `INSERT INTO attendance (user_email, date, status, check_in_time, remarks)
                         VALUES (?, ?, ?, ?, ?)`;

    db.query(insertQuery, [email, currentDate, status, checkIn, remarks], (err2) => {
      if (err2) return res.status(500).json({ message: 'Failed to mark attendance' });

      return res.status(200).json({ message: `Attendance marked as ${status}` });
    });
  });
};

const markCheckout = (req, res) => {
  const { email } = req.body;
  const currentDate = new Date().toISOString().slice(0, 10);
  const checkoutTime = new Date().toTimeString().slice(0, 8);

  const checkQuery = `
    SELECT * FROM attendance 
    WHERE user_email = ? AND date = ?`;

  db.query(checkQuery, [email, currentDate], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error during check' });

    if (results.length === 0) {
      return res.status(400).json({ message: 'No attendance record found for today' });
    }

    const updateQuery = `
      UPDATE attendance
      SET check_out_time = ?
      WHERE user_email = ? AND date = ?`;

    db.query(updateQuery, [checkoutTime, email, currentDate], (err, result) => {
      if (err) return res.status(500).json({ message: 'Failed to mark checkout' });

      return res.status(200).json({ message: 'Checkout marked successfully' });
    });
  });
};

const getMonthlyAttendance = async (req, res) => {
  try {
    const { month } = req.query;
    const targetMonth = month || moment().format('YYYY-MM');

    const users = await User.find({}, 'firstName lastName email role').sort({ role: 1 }).lean();

    const query = `
      SELECT * FROM attendance 
      WHERE DATE_FORMAT(date, '%Y-%m') = ?
    `;

    db.query(query, [targetMonth], (err, results) => {
      if (err) return res.status(500).json({ error: 'DB error' });

      const attendanceMap = {};

      results.forEach(entry => {
        const email = entry.user_email;
        const day = moment(entry.date).date();
        if (!attendanceMap[email]) attendanceMap[email] = {};
        attendanceMap[email][day] = entry.status[0];
      });

      const totalDays = moment(targetMonth, 'YYYY-MM').daysInMonth();
      const response = users.map(user => {
        const daily = {};
        for (let d = 1; d <= totalDays; d++) {
          daily[d] = attendanceMap[user.email]?.[d] || '-';
        }

        return {
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          attendance: daily
        };
      });

      res.json(response);
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  markAttendance,
  markCheckout,
  getMonthlyAttendance
};