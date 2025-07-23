const express = require('express');
const router = express.Router();
const { 
  markAttendance, 
  markCheckout, 
  getMonthlyAttendance, 
  markHalfDay, 
  markLeave 
} = require('../Controllers/AttendanceController');

router.post('/mark', markAttendance);
router.post('/checkout', markCheckout);
router.get('/monthly', getMonthlyAttendance);
router.post('/halfday', markHalfDay);
router.post('/leave', markLeave);

module.exports = router;