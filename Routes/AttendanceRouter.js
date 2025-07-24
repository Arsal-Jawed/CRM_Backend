const express = require('express');
const router = express.Router();

const { 
  markAttendance, 
  markCheckout, 
  getMonthlyAttendance, 
  markHalfDay, 
  markLeave,
  markAllPresent,
  markAllAbsent,
  markAllLate,
  markAllLeave
} = require('../Controllers/AttendanceController');

// Individual actions
router.post('/mark', markAttendance);
router.post('/checkout', markCheckout);
router.get('/monthly', getMonthlyAttendance);
router.post('/halfday', markHalfDay);
router.post('/leave', markLeave);

// Bulk actions
router.post('/all-present', markAllPresent);
router.post('/all-absent', markAllAbsent);
router.post('/all-late', markAllLate);
router.post('/all-leave', markAllLeave);

module.exports = router;
