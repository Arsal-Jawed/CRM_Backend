const db = require('../db');

const createScheduleTable = () => {
  const query = `
    CREATE TABLE IF NOT EXISTS schedules (
      id INT AUTO_INCREMENT PRIMARY KEY,
      scheduler VARCHAR(255) NOT NULL,
      details TEXT NOT NULL,
      set_date DATE DEFAULT CURRENT_DATE,
      visibility ENUM('public', 'private') DEFAULT 'private',
      schedule_date DATE NOT NULL,
      seen ENUM('pending', 'marked', 'missed') DEFAULT 'pending'
    )
  `;

  db.query(query, (err) => {
    if (err) throw err;
    console.log('Schedule table created/verified');
  });
};

module.exports = { createScheduleTable };