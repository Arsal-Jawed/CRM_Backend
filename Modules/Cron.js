const cron = require('node-cron');
const nodemailer = require('nodemailer');
const mysql = require('mysql2');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'callsidcrm@gmail.com',
    pass: process.env.AppPass
  }
});

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'crm'
});

cron.schedule('7 14 * * *', () => {
  const today = new Date().toISOString().split('T')[0];

  const query = `
    SELECT s.scheduler, s.details, u.firstName, u.lastName, u.email
    FROM schedules s
    JOIN users u ON s.scheduler = u.email
    WHERE s.schedule_date = ?
  `;

  db.query(query, [today], async (err, results) => {
    if (err) return console.error('DB error:', err);

    for (let row of results) {
      const fullName = `${row.firstName} ${row.lastName}`;
      const mailOptions = {
        from: 'callsidcrm@gmail.com',
        to: row.email,
        subject: '📅 Schedule Reminder',
        text: `Hi ${fullName},\n\nThis is a reminder for your scheduled task today:\n\n"${row.details}"\n\nPlease make sure to take action.\n\n- CallSid CRM`
      };

      try {
        await transporter.sendMail(mailOptions);
        console.log(`Email sent to ${row.email}`);
      } catch (emailErr) {
        console.error(`Failed to send email to ${row.email}:`, emailErr);
      }
    }
  });
});
