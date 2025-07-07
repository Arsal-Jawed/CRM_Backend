const db = require('../db');

const getAllNotifications = (req, res) => {
  const query = 'SELECT * FROM notification ORDER BY date DESC';

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching notifications:', err);
      return res.status(500).json({ error: 'Failed to fetch notifications' });
    }

    res.json(results);
  });
};

module.exports = { getAllNotifications };
