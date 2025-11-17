const db = require('../db');
const moment = require('moment');
const User = require('../Models/UserModel');

const markAttendance = async (req, res) => {
  const { email, remarks = '' } = req.body;
  const now = new Date();
  const currentDate = now.toISOString().slice(0, 10);
  const checkIn = now.toTimeString().slice(0, 8);

  // Attendance Window (PM)
  const start = new Date();
  start.setHours(21, 0, 0);   // 9:00 PM

  const end = new Date();
  end.setHours(23, 59, 0);    // 11:59 PM

  if (now < start || now > end) {
    return res.status(200).json({ message: 'Attendance window closed' });
  }

  try {
    const user = await User.findOne({ email }).lean();
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Late time (PM)
    const late = new Date();
    if (user.role === 1) {
      late.setHours(22, 20, 0);   // 10:20 PM
    } else {
      late.setHours(21, 40, 0);   // 9:40 PM
    }

    const status = now < late ? 'Present' : 'Late';

    const checkQuery = `SELECT * FROM attendance WHERE user_email = ? AND date = ?`;

    db.query(checkQuery, [email, currentDate], (err2, rows) => {
      if (err2) {
        console.error('Database error:', err2);
        return res.status(500).json({ message: 'Database error' });
      }

      if (rows.length > 0) {
        return res.status(400).json({ message: 'Attendance already marked for today' });
      }

      const insertQuery = `
        INSERT INTO attendance (user_email, date, status, check_in_time, remarks)
        VALUES (?, ?, ?, ?, ?)
      `;

      db.query(insertQuery, [email, currentDate, status, checkIn, remarks], (err3) => {
        if (err3) {
          console.error('Insert error:', err3);
          return res.status(500).json({ message: 'Failed to mark attendance' });
        }

        return res.status(200).json({ message: `Attendance marked as ${status}` });
      });
    });
  } catch (err) {
    console.error('Mongoose error:', err);
    return res.status(500).json({ message: 'Error fetching user role' });
  }
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
      const checkInMap = {};
      const remarksMap = {};   // ✅ Added remarks map
      
      results.forEach(entry => {
        const email = entry.user_email;
        const day = moment(entry.date).date();

        if (!attendanceMap[email]) {
          attendanceMap[email] = {};
          checkInMap[email] = {};
          remarksMap[email] = {};  // ✅ Initialize remarks map
        }

        attendanceMap[email][day] = entry.status[0];
        checkInMap[email][day] = entry.check_in_time || null;
        remarksMap[email][day] = entry.remarks || null;  // ✅ Store remarks
      });

      const totalDays = moment(targetMonth, 'YYYY-MM').daysInMonth();
      const response = users.map(user => {
        const daily = {};
        const checkInTimes = {};
        const dailyRemarks = {};  // ✅ New object to gather remarks

        for (let d = 1; d <= totalDays; d++) {
          daily[d] = attendanceMap[user.email]?.[d] || '-';
          checkInTimes[d] = checkInMap[user.email]?.[d] || null;
          dailyRemarks[d] = remarksMap[user.email]?.[d] || null;  // ✅ Add remarks per day
        }

        return {
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          attendance: daily,
          checkInTimes,
          remarks: dailyRemarks   // ✅ Include in final response
        };
      });

      res.json(response);
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

async function insertNotification(managerEmail, detail) {
  const managerUser = await User.findOne({ email: managerEmail }, 'firstName lastName').lean();
  if (!managerUser) return;
  const notifierName = `${managerUser.firstName} ${managerUser.lastName}`;
  const now = moment().format('YYYY-MM-DD HH:mm:ss');
  return new Promise((resolve, reject) => {
    db.query(
      `INSERT INTO notification (notifier, detail, date) VALUES (?, ?, ?)`,
      [notifierName, detail, now],
      (err) => {
        if (err) return reject(err);
        resolve();
      }
    );
  });
}

const markHalfDay = (req, res) => {
  const { email, remarks = '', manager } = req.body;
  const currentDate = new Date().toISOString().slice(0, 10);

  const checkQuery = `SELECT * FROM attendance WHERE user_email = ? AND date = ?`;

  db.query(checkQuery, [email, currentDate], (err, rows) => {
    if (err) return res.status(500).json({ message: 'Database error' });

    const finalize = async (msg) => {
      await insertNotification(manager, `${email} marked Half Day by manager`);
      return res.status(200).json({ message: msg });
    };

    if (rows.length > 0) {
      const updateQuery = `
        UPDATE attendance 
        SET status = 'Half', remarks = ?
        WHERE user_email = ? AND date = ?`;

      db.query(updateQuery, [remarks, email, currentDate], async (err2) => {
        if (err2) return res.status(500).json({ message: 'Failed to update status to Halfday' });
        await finalize('Attendance updated to Halfday');
      });
    } else {
      const insertQuery = `
        INSERT INTO attendance (user_email, date, status, remarks, check_in_time)
        VALUES (?, ?, 'Half', ?, ?)`;

      db.query(insertQuery, [email, currentDate, remarks, '11:59:30'], async (err2) => {
        if (err2) return res.status(500).json({ message: 'Failed to mark Halfday' });
        await finalize('Halfday marked successfully');
      });
    }
  });
};

const markLeave = (req, res) => {
  const { email, fromDate, toDate, remarks = '', manager } = req.body;

  if (!fromDate || !toDate || !email) {
    return res.status(400).json({ message: 'email, fromDate, and toDate are required' });
  }

  const startDate = moment(fromDate);
  const endDate = moment(toDate);

  if (!startDate.isValid() || !endDate.isValid() || endDate.isBefore(startDate)) {
    return res.status(400).json({ message: 'Invalid date range' });
  }

  const dates = [];
  let current = startDate.clone();

  while (current.isSameOrBefore(endDate)) {
    dates.push(current.format('YYYY-MM-DD'));
    current.add(1, 'days');
  }

  let completed = 0;
  let hasError = false;

  dates.forEach(date => {
    const checkQuery = `SELECT * FROM attendance WHERE user_email = ? AND date = ?`;

    db.query(checkQuery, [email, date], (err, rows) => {
      if (err) {
        hasError = true;
        return;
      }

      const finalize = async () => {
        completed++;
        if (completed === dates.length) {
          await insertNotification(manager, `${email} marked Leave (${fromDate} to ${toDate}) by manager`);
          if (hasError) return res.status(500).json({ message: 'Some records failed to process' });
          return res.status(200).json({ message: 'Leave marked successfully on given dates' });
        }
      };

      if (rows.length > 0) {
        const updateQuery = `
          UPDATE attendance
          SET status = 'Leave', remarks = ?
          WHERE user_email = ? AND date = ?`;

        db.query(updateQuery, [remarks, email, date], async (err2) => {
          if (err2) hasError = true;
          await finalize();
        });
      } else {
        const insertQuery = `
          INSERT INTO attendance (user_email, date, status, remarks)
          VALUES (?, ?, 'Leave', ?)`; 

        db.query(insertQuery, [email, date, remarks], async (err2) => {
          if (err2) hasError = true;
          await finalize();
        });
      }
    });
  });
};

const markAllWithStatus = async (req, res, status) => {
  const { date, remarks = '', manager } = req.body;
  const targetDate = date || moment().format('YYYY-MM-DD');

  try {
    const users = await User.find({}, 'email').lean();
    const emails = users.map(u => u.email);

    let completed = 0;
    let hasError = false;

    emails.forEach(email => {
      const checkQuery = `SELECT * FROM attendance WHERE user_email = ? AND date = ?`;

      db.query(checkQuery, [email, targetDate], (err, rows) => {
        if (err) {
          hasError = true;
          completed++;
          return;
        }

        const finalize = async () => {
          completed++;
          if (completed === emails.length) {
            await insertNotification(manager, `All users marked as ${status} by manager`);
            if (hasError) return res.status(500).json({ message: `Some records failed to process as ${status}` });
            return res.status(200).json({ message: `All users marked as ${status}` });
          }
        };

        if (rows.length > 0) {
          const updateQuery = `
            UPDATE attendance 
            SET status = ?, remarks = ?
            WHERE user_email = ? AND date = ?`;

          db.query(updateQuery, [status, remarks, email, targetDate], async (err2) => {
            if (err2) hasError = true;
            await finalize();
          });
        } else {
          const insertQuery = `
            INSERT INTO attendance (user_email, date, status, remarks)
            VALUES (?, ?, ?, ?)
          `;

          db.query(insertQuery, [email, targetDate, status, remarks], async (err2) => {
            if (err2) hasError = true;
            await finalize();
          });
        }
      });
    });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

const markAllPresent = (req, res) => markAllWithStatus(req, res, 'Present');
const markAllAbsent = (req, res) => markAllWithStatus(req, res, 'Absent');
const markAllLate = (req, res) => markAllWithStatus(req, res, 'Late');
const markAllLeave = (req, res) => markAllWithStatus(req, res, 'Leave');

module.exports = {
  markAttendance,
  markCheckout,
  getMonthlyAttendance,
  markHalfDay,
  markLeave,
  markAllPresent,
  markAllAbsent,
  markAllLate,
  markAllLeave
};