const cron = require('node-cron');
const nodemailer = require('nodemailer');
const mysql = require('mysql2');
const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../Models/UserModel');

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

mongoose.connect(process.env.MongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('Connected to MongoDB Atlas'))
  .catch(err => console.error('MongoDB connection error:', err));

cron.schedule('26 5 * * *', async () => {
  try {
    const today = new Date().toISOString().split('T')[0];
    console.log(`Cron triggered for date: ${today}`);

    const scheduleQuery = `
      SELECT scheduler, details 
      FROM schedules 
      WHERE schedule_date = ?
    `;

    db.query(scheduleQuery, [today], async (err, schedules) => {
      if (err) {
        console.error('DB query error:', err);
        return;
      }

      if (schedules.length === 0) {
        console.log('No schedules found for today.');
        return;
      }

      for (let sched of schedules) {
        // Fetch user from MongoDB
        const user = await User.findOne({ email: sched.scheduler });

        if (!user) {
          console.log(`❌ User with email ${sched.scheduler} not found in MongoDB.`);
          continue;
        }

        const fullName = `${user.firstName} ${user.lastName}`;
        const mailOptions = {
          from: 'callsidcrm@gmail.com',
          to: user.email,
          subject: '📅 Schedule Reminder',
          text: `Hi ${fullName},\n\nThis is a reminder for your scheduled task today:\n\n"${sched.details}"\n\nPlease make sure to take action.\n\n- CallSid CRM`
        };

        try {
          await transporter.sendMail(mailOptions);
          console.log(`✅ Email sent to ${user.email}`);
        } catch (emailErr) {
          console.error(`❌ Failed to send email to ${user.email}:`, emailErr);
        }
      }
    });

  } catch (err) {
    console.error('Unexpected error in cron job:', err);
  }
}, {
  timezone: 'Asia/Karachi'
});
