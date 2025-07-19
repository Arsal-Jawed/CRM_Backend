const express = require('express');
const router = express.Router();
const { markAttendance, markCheckout,getMonthlyAttendance } = require('../Controllers/AttendanceController');

router.post('/mark', markAttendance);
router.post('/checkout', markCheckout);
router.get('/monthly', getMonthlyAttendance);

module.exports = router;