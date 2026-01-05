const Attendance = require('../Models/AttendanceModel');
const Notification = require('../Models/NotificationModel');
const moment = require('moment');
const User = require('../Models/UserModel');

const markAttendance = async (req, res) => {
  const { email, remarks = '' } = req.body;
  const now = new Date();
  const currentDate = new Date(now);
  currentDate.setHours(0, 0, 0, 0);

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
    const checkIn = now.toTimeString().slice(0, 8);

    // Check if attendance already exists for today
    const nextDay = new Date(currentDate);
    nextDay.setDate(nextDay.getDate() + 1);
    
    const existingAttendance = await Attendance.findOne({
      user_email: email,
      date: {
        $gte: currentDate,
        $lt: nextDay
      }
    });

    if (existingAttendance) {
      return res.status(400).json({ message: 'Attendance already marked for today' });
    }

    // Create new attendance record
    await Attendance.create({
      user_email: email,
      date: currentDate,
      status,
      check_in_time: checkIn,
      remarks
    });

    return res.status(200).json({ message: `Attendance marked as ${status}` });
  } catch (err) {
    console.error('Error:', err);
    return res.status(500).json({ message: 'Error marking attendance' });
  }
};

const markCheckout = async (req, res) => {
  const { email } = req.body;
  const currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);
  const nextDay = new Date(currentDate);
  nextDay.setDate(nextDay.getDate() + 1);
  const checkoutTime = new Date().toTimeString().slice(0, 8);

  try {
    const attendance = await Attendance.findOne({
      user_email: email,
      date: {
        $gte: currentDate,
        $lt: nextDay
      }
    });

    if (!attendance) {
      return res.status(400).json({ message: 'No attendance record found for today' });
    }

    attendance.check_out_time = checkoutTime;
    await attendance.save();

    return res.status(200).json({ message: 'Checkout marked successfully' });
  } catch (err) {
    console.error('Error:', err);
    return res.status(500).json({ message: 'Failed to mark checkout' });
  }
};

const getMonthlyAttendance = async (req, res) => {
  try {
    const { month } = req.query;
    const targetMonth = month || moment().format('YYYY-MM');
    const users = await User.find({}, 'firstName lastName email role').sort({ role: 1 }).lean();

    const startDate = moment(targetMonth, 'YYYY-MM').startOf('month').toDate();
    const endDate = moment(targetMonth, 'YYYY-MM').endOf('month').toDate();

    const attendanceRecords = await Attendance.find({
      date: {
        $gte: startDate,
        $lte: endDate
      }
    }).lean();

    const attendanceMap = {};
    const checkInMap = {};
    const remarksMap = {};

    attendanceRecords.forEach(entry => {
      const email = entry.user_email;
      const day = moment(entry.date).date();

      if (!attendanceMap[email]) {
        attendanceMap[email] = {};
        checkInMap[email] = {};
        remarksMap[email] = {};
      }

      attendanceMap[email][day] = entry.status[0];
      checkInMap[email][day] = entry.check_in_time || null;
      remarksMap[email][day] = entry.remarks || null;
    });

    const totalDays = moment(targetMonth, 'YYYY-MM').daysInMonth();
    const response = users.map(user => {
      const daily = {};
      const checkInTimes = {};
      const dailyRemarks = {};

      for (let d = 1; d <= totalDays; d++) {
        daily[d] = attendanceMap[user.email]?.[d] || '-';
        checkInTimes[d] = checkInMap[user.email]?.[d] || null;
        dailyRemarks[d] = remarksMap[user.email]?.[d] || null;
      }

      return {
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        attendance: daily,
        checkInTimes,
        remarks: dailyRemarks
      };
    });

    res.json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

async function insertNotification(managerEmail, detail) {
  try {
    const managerUser = await User.findOne({ email: managerEmail }, 'firstName lastName').lean();
    if (!managerUser) return;
    const notifierName = `${managerUser.firstName} ${managerUser.lastName}`;
    
    await Notification.create({
      notifier: notifierName,
      detail,
      date: new Date()
    });
  } catch (err) {
    console.error('Error inserting notification:', err);
  }
}

const markHalfDay = async (req, res) => {
  const { email, remarks = '', manager } = req.body;
  const currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);
  const nextDay = new Date(currentDate);
  nextDay.setDate(nextDay.getDate() + 1);

  try {
    const attendance = await Attendance.findOne({
      user_email: email,
      date: {
        $gte: currentDate,
        $lt: nextDay
      }
    });

    const finalize = async (msg) => {
      await insertNotification(manager, `${email} marked Half Day by manager`);
      return res.status(200).json({ message: msg });
    };

    if (attendance) {
      attendance.status = 'Half';
      attendance.remarks = remarks;
      await attendance.save();
      await finalize('Attendance updated to Halfday');
    } else {
      await Attendance.create({
        user_email: email,
        date: currentDate,
        status: 'Half',
        remarks,
        check_in_time: '11:59:30'
      });
      await finalize('Halfday marked successfully');
    }
  } catch (err) {
    console.error('Error:', err);
    return res.status(500).json({ message: 'Failed to mark Halfday' });
  }
};

const markLeave = async (req, res) => {
  const { email, fromDate, toDate, remarks = '', manager } = req.body;

  if (!fromDate || !toDate || !email) {
    return res.status(400).json({ message: 'email, fromDate, and toDate are required' });
  }

  const startDate = moment(fromDate);
  const endDate = moment(toDate);

  if (!startDate.isValid() || !endDate.isValid() || endDate.isBefore(startDate)) {
    return res.status(400).json({ message: 'Invalid date range' });
  }

  try {
    const dates = [];
    let current = startDate.clone();

    while (current.isSameOrBefore(endDate)) {
      dates.push(current.toDate());
      current.add(1, 'days');
    }

    const operations = dates.map(date => {
      const dateStart = new Date(date);
      dateStart.setHours(0, 0, 0, 0);
      const dateEnd = new Date(date);
      dateEnd.setHours(23, 59, 59, 999);

      return {
        updateOne: {
          filter: {
            user_email: email,
            date: {
              $gte: dateStart,
              $lt: new Date(dateEnd.getTime() + 1)
            }
          },
          update: {
            $set: {
              user_email: email,
              date: dateStart,
              status: 'Leave',
              remarks
            }
          },
          upsert: true
        }
      };
    });

    await Attendance.bulkWrite(operations);
    await insertNotification(manager, `${email} marked Leave (${fromDate} to ${toDate}) by manager`);
    return res.status(200).json({ message: 'Leave marked successfully on given dates' });
  } catch (err) {
    console.error('Error:', err);
    return res.status(500).json({ message: 'Failed to mark leave' });
  }
};

const markAllWithStatus = async (req, res, status) => {
  const { date, remarks = '', manager } = req.body;
  const targetDate = date ? moment(date).toDate() : moment().toDate();
  targetDate.setHours(0, 0, 0, 0);
  const nextDay = new Date(targetDate);
  nextDay.setDate(nextDay.getDate() + 1);

  try {
    const users = await User.find({}, 'email').lean();
    const emails = users.map(u => u.email);

    const operations = emails.map(email => ({
      updateOne: {
        filter: {
          user_email: email,
          date: {
            $gte: targetDate,
            $lt: nextDay
          }
        },
        update: {
          $set: {
            user_email: email,
            date: targetDate,
            status,
            remarks
          }
        },
        upsert: true
      }
    }));

    await Attendance.bulkWrite(operations);
    await insertNotification(manager, `All users marked as ${status} by manager`);
    return res.status(200).json({ message: `All users marked as ${status}` });
  } catch (err) {
    console.error('Error:', err);
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
