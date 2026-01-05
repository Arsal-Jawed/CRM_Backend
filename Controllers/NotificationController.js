const Notification = require('../Models/NotificationModel');

const getAllNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find()
      .sort({ date: -1 })
      .lean();

    res.json(notifications);
  } catch (err) {
    console.error('Error fetching notifications:', err);
    return res.status(500).json({ error: 'Failed to fetch notifications' });
  }
};

module.exports = { getAllNotifications };
