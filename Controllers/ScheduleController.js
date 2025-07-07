const db = require('../db');
const User = require('../Models/UserModel');

// 1. Create Schedule
const createSchedule = async (req, res) => {
  const { scheduler, details, schedule_date, visibility = 'private' } = req.body;
  const set_date = new Date().toISOString().split('T')[0];

  try {
    const user = await User.findOne({ email: scheduler });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const notifier = `${user.firstName} ${user.lastName}`;
    const notificationDetail = `Created a schedule: ${details}`;
    const notificationDate = new Date();
    const scheduleQuery = `
      INSERT INTO schedules (scheduler, details, set_date, schedule_date, visibility)
      VALUES (?, ?, ?, ?, ?)
    `;
    db.query(scheduleQuery, [scheduler, details, set_date, schedule_date, visibility], (err, result) => {
      if (err) return res.status(500).json({ error: 'Failed to create schedule' });
      const notifQuery = `
        INSERT INTO notification (notifier, detail, date)
        VALUES (?, ?, ?)
      `;
      db.query(notifQuery, [notifier, notificationDetail, notificationDate], (notifErr) => {
        if (notifErr) console.error('Notification error:', notifErr);
      });

      res.status(201).json({ message: 'Schedule created successfully', id: result.insertId });
    });
  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// 2. Get all Schedules by Scheduler
const getSchedulesByScheduler = (req, res) => {
  const { scheduler } = req.params;

  const query = `SELECT * FROM schedules WHERE scheduler = ?`;
  db.query(query, [scheduler], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch schedules' });
    res.status(200).json(rows);
  });
};

// 3. Get all Public Schedules
const getPublicSchedules = (req, res) => {
  const email = req.query.email;
  const query = `SELECT * FROM schedules WHERE visibility = 'public' OR scheduler = ?`;

  db.query(query, [email], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch schedules' });
    res.status(200).json(rows);
  });
};

// 4. Mark Schedule as Public
const markSchedulePublic = (req, res) => {
  const { id } = req.params;

  const query = `UPDATE schedules SET visibility = 'public' WHERE id = ?`;
  db.query(query, [id], (err) => {
    if (err) return res.status(500).json({ error: 'Failed to mark as public' });
    res.status(200).json({ message: 'Schedule marked as public' });
  });
};

// 5. Delete a Schedule
const deleteSchedule = (req, res) => {
  const { id } = req.params;

  const query = `DELETE FROM schedules WHERE id = ?`;
  db.query(query, [id], (err) => {
    if (err) return res.status(500).json({ error: 'Failed to delete schedule' });
    res.status(200).json({ message: 'Schedule deleted successfully' });
  });
};

// 6. Edit Schedule
const editSchedule = (req, res) => {
  const { id } = req.params;
  const { details, schedule_date, visibility } = req.body;

  const query = `
    UPDATE schedules 
    SET details = ?, schedule_date = ?, visibility = ? 
    WHERE id = ?
  `;
  db.query(query, [details, schedule_date, visibility, id], (err) => {
    if (err) return res.status(500).json({ error: 'Failed to update schedule' });
    res.status(200).json({ message: 'Schedule updated successfully' });
  });
};

// 7. Get Today Schedules
const getTodayScheduleCount = (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  const today = new Date().toISOString().split('T')[0];

  const query = `
    SELECT COUNT(*) AS count
    FROM schedules
    WHERE scheduler = ? AND DATE(schedule_date) = ?
  `;

  db.query(query, [email, today], (err, results) => {
    if (err) return res.status(500).json({ error: 'DB Error' });
    res.json({ count: results[0].count });
  });
};

module.exports = {
  createSchedule,
  getSchedulesByScheduler,
  getPublicSchedules,
  markSchedulePublic,
  deleteSchedule,
  editSchedule,
  getTodayScheduleCount
};
