const express = require('express');
const router = express.Router();
const { getAllNotifications } = require('../Controllers/NotificationController');

router.get('/', getAllNotifications);

module.exports = router;
