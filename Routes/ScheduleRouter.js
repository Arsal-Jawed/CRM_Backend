const express = require('express');
const {
  createSchedule,
  getSchedulesByScheduler,
  getPublicSchedules,
  markSchedulePublic,
  deleteSchedule,
  editSchedule,
  getTodayScheduleCount,
  markSchedule,
  markMissed
} = require('../Controllers/ScheduleController');

const router = express.Router();

router.post('/createSchedule', createSchedule);
router.get('/scheduler/:scheduler', getSchedulesByScheduler);
router.get('/publicSchedules', getPublicSchedules);
router.put('/markPublic/:id', markSchedulePublic);
router.delete('/deleteSchedule/:id', deleteSchedule);
router.put('/editSchedule/:id', editSchedule);
router.get('/todayCount', getTodayScheduleCount);
router.patch('/:scheduleId/mark', markSchedule);

setInterval(markMissed, 24 * 60 * 60 * 1000);

markMissed();

module.exports = router;
