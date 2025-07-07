const express = require('express');
const {
  createSchedule,
  getSchedulesByScheduler,
  getPublicSchedules,
  markSchedulePublic,
  deleteSchedule,
  editSchedule,
  getTodayScheduleCount
} = require('../Controllers/ScheduleController');

const router = express.Router();

router.post('/createSchedule', createSchedule);
router.get('/scheduler/:scheduler', getSchedulesByScheduler);
router.get('/publicSchedules', getPublicSchedules);
router.put('/markPublic/:id', markSchedulePublic);
router.delete('/deleteSchedule/:id', deleteSchedule);
router.put('/editSchedule/:id', editSchedule);
router.get('/todayCount', getTodayScheduleCount);

module.exports = router;
