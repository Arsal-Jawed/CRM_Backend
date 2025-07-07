const express = require('express');
const router = express.Router();
const {
  addRemark,
  getRemarksByLeadGen,
  getAllRemarks,
  getRemarksByClosure
} = require('../Controllers/RemarksController');

router.post('/addRemark', addRemark);
router.get('/leadGen/:leadGen', getRemarksByLeadGen);
router.get('/all', getAllRemarks);
router.get('/closure/:closure', getRemarksByClosure);

module.exports = router;