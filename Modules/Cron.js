const cron = require('node-cron');
const nodemailer = require('nodemailer');
const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../Models/UserModel');
const Schedule = require('../Models/ScheduleModel');
const Notification = require('../Models/NotificationModel');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'callsidcrm@gmail.com',
    pass: process.env.AppPass
  }
});

// MongoDB connection is handled by config.js in index.js, so we don't need to connect here
// The mongoose connection will be shared across the app

cron.schedule('10 23 * * *', async () => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    console.log(`Cron triggered for date: ${today.toISOString().split('T')[0]}`);

    const schedules = await Schedule.find({
      schedule_date: {
        $gte: today,
        $lt: tomorrow
      }
    }).lean();

    if (schedules.length === 0) {
      console.log('No schedules found for today.');
      return;
    }

    for (let sched of schedules) {
      const user = await User.findOne({ email: sched.scheduler });

      if (!user) {
        console.log(`❌ User with email ${sched.scheduler} not found in MongoDB.`);
        continue;
      }

      const fullName = `${user.firstName} ${user.lastName}`;
      const formattedDate = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      const mailOptions = {
        from: 'CallSid CRM <callsidcrm@gmail.com>',
        to: user.email,
        subject: `📅 Schedule Reminder: ${sched.details.substring(0, 30)}...`,
        html: `
          <div style="font-family:'Segoe UI', Arial, sans-serif; max-width:600px; margin:20px auto; border-radius:10px; overflow:hidden; box-shadow:0 3px 10px rgba(0,0,0,0.1); border:1px solid #e0e0e0;">
            <div style="background:#4a6baf; color:white; padding:25px; text-align:center;">
              <h1 style="margin:0; font-size:24px; font-weight:600;">CallSid CRM Reminder</h1>
              <p style="margin:8px 0 0; font-size:14px; opacity:0.9;">Your Scheduled Task Alert</p>
            </div>

            <div style="padding:25px; background:#f9fafc;">
              <h2 style="color:#2c3e50; margin-top:0;">Hello, ${fullName}!</h2>
              <p style="color:#5d6d7e; font-size:15px; line-height:1.5;">
                This is a friendly reminder about your scheduled task for <strong>${formattedDate}</strong>:
              </p>

              <div style="background:#edf2f7; padding:18px; border-left:4px solid #4a6baf; border-radius:5px; margin:20px 0;">
                <p style="margin:0; color:#2c3e50; font-size:16px; line-height:1.6;">
                  <span style="display:inline-block; width:24px;">📌</span>
                  <strong>Task:</strong> ${sched.details}
                </p>
              </div>

              <div style="margin-top:30px; padding-top:20px; border-top:1px solid #e0e0e0;">
                <p style="color:#7f8c8d; font-size:14px; margin-bottom:5px;">
                  <strong>⏰ Time:</strong> All day reminder
                </p>
                <p style="color:#7f8c8d; font-size:14px; margin-top:5px;">
                  <strong>📧 Sent to:</strong> ${user.email}
                </p>
              </div>

              <p style="color:#95a5a6; font-size:13px; margin-top:30px; line-height:1.5;">
                Please take appropriate action for this scheduled task. If you've already completed it, 
                you may disregard this reminder.
              </p>
            </div>

            <div style="background:#f1f5f9; padding:15px; text-align:center; font-size:12px; color:#7f8c8d;">
              <p style="margin:0;">
                &copy; ${new Date().getFullYear()} CallSid CRM. 
                <span style="display:inline-block; margin:0 5px;">|</span>
                All rights reserved.
              </p>
            </div>
          </div>
        `
      };

      try {
        await transporter.sendMail(mailOptions);
        console.log(`✅ Email sent to ${user.email}`);
      } catch (emailErr) {
        console.error(`❌ Failed to send email to ${user.email}:`, emailErr);
      }
    }

  } catch (err) {
    console.error('Unexpected error in cron job:', err);
  }
}, {
  timezone: 'Asia/Karachi'
});

// Clean up notifications older than 3 days - runs daily at 2 AM
cron.schedule('0 2 * * *', async () => {
  try {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    threeDaysAgo.setHours(0, 0, 0, 0);

    const result = await Notification.deleteMany({
      date: { $lt: threeDaysAgo }
    });

    console.log(`🧹 Cleaned up ${result.deletedCount} notification(s) older than 3 days`);
  } catch (err) {
    console.error('❌ Error cleaning up old notifications:', err);
  }
}, {
  timezone: 'Asia/Karachi'
});

// Clean up schedules the day after their scheduled date - runs daily at 3 AM
// Deletes schedules where schedule_date is before today (i.e., yesterday and earlier)
cron.schedule('0 3 * * *', async () => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const result = await Schedule.deleteMany({
      schedule_date: { $lt: today }
    });

    console.log(`🧹 Cleaned up ${result.deletedCount} schedule(s) that passed their scheduled date`);
  } catch (err) {
    console.error('❌ Error cleaning up old schedules:', err);
  }
}, {
  timezone: 'Asia/Karachi'
});
