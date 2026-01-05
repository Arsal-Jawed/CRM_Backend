const Schedule = require('../Models/ScheduleModel');
const Notification = require('../Models/NotificationModel');
const User = require('../Models/UserModel');

// 1. Create Schedule
const createSchedule = async (req, res) => {
  const { scheduler, details, schedule_date, visibility = 'private' } = req.body;
  const set_date = new Date();

  try {
    const user = await User.findOne({ email: scheduler });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const notifier = `${user.firstName} ${user.lastName}`;
    const notificationDetail = `Created a schedule: ${details}`;
    const notificationDate = new Date();

    const schedule = await Schedule.create({
      scheduler,
      details,
      set_date,
      schedule_date: new Date(schedule_date),
      visibility
    });

    // Create notification
    try {
      await Notification.create({
        notifier,
        detail: notificationDetail,
        date: notificationDate
      });
    } catch (notifErr) {
      console.error('Notification error:', notifErr);
    }

    res.status(201).json({ message: 'Schedule created successfully', id: schedule._id });
  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// 2. Get all Schedules by Scheduler
const getSchedulesByScheduler = async (req, res) => {
  const { scheduler } = req.params;
  
  try {
    const schedules = await Schedule.find({ scheduler })
      .sort({ schedule_date: 1 })
      .lean();
    
    res.status(200).json(schedules);
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: 'Failed to fetch schedules' });
  }
};

// 3. Get all Public Schedules
const getPublicSchedules = async (req, res) => {
  const email = req.query.email;

  try {
    const schedules = await Schedule.find({
      $or: [
        { visibility: 'public' },
        { scheduler: email }
      ]
    })
      .sort({ schedule_date: 1 })
      .lean();

    res.status(200).json(schedules);
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: 'Failed to fetch schedules' });
  }
};

// 4. Mark Schedule as Public
const markSchedulePublic = async (req, res) => {
  const { id } = req.params;

  try {
    const schedule = await Schedule.findByIdAndUpdate(
      id,
      { visibility: 'public' },
      { new: true }
    );

    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    res.status(200).json({ message: 'Schedule marked as public' });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: 'Failed to mark as public' });
  }
};

// 5. Delete a Schedule
const deleteSchedule = async (req, res) => {
  const { id } = req.params;

  try {
    const schedule = await Schedule.findByIdAndDelete(id);

    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    res.status(200).json({ message: 'Schedule deleted successfully' });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: 'Failed to delete schedule' });
  }
};

// 6. Edit Schedule
const editSchedule = async (req, res) => {
  const { id } = req.params;
  const { details, schedule_date, visibility } = req.body;

  try {
    const updateData = {};
    if (details) updateData.details = details;
    if (schedule_date) updateData.schedule_date = new Date(schedule_date);
    if (visibility) updateData.visibility = visibility;

    const schedule = await Schedule.findByIdAndUpdate(id, updateData, { new: true });

    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    res.status(200).json({ message: 'Schedule updated successfully' });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: 'Failed to update schedule' });
  }
};

// 7. Get Today Schedules
const getTodayScheduleCount = async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const count = await Schedule.countDocuments({
      scheduler: email,
      schedule_date: {
        $gte: today,
        $lt: tomorrow
      },
      seen: { $in: ['pending', 'missed'] }
    });

    res.json({ count });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: 'DB Error' });
  }
};

// 8. Mark Schedule
const markSchedule = async (req, res) => {
  const { scheduleId } = req.params;

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const schedule = await Schedule.findOneAndUpdate(
      {
        _id: scheduleId,
        seen: 'pending',
        schedule_date: { $gte: today }
      },
      { seen: 'marked' },
      { new: true }
    );

    if (!schedule) {
      return res.status(404).json({
        error: 'Schedule not found, already processed, or date passed'
      });
    }

    res.json({ message: 'Schedule marked successfully' });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: 'Database error' });
  }
};

// 9. Mark Schedule Missing
const markMissed = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const result = await Schedule.updateMany(
      {
        seen: 'pending',
        schedule_date: { $lt: today }
      },
      { seen: 'missed' }
    );

    console.log(`Missed schedules updated: ${result.modifiedCount}`);
  } catch (err) {
    console.error('Missed schedules update failed:', err);
  }
};

module.exports = {
  createSchedule,
  getSchedulesByScheduler,
  getPublicSchedules,
  markSchedulePublic,
  deleteSchedule,
  editSchedule,
  getTodayScheduleCount,
  markSchedule,
  markMissed
};
