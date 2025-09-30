const express = require('express');
const router = express.Router();
const {
  addData,
  getDataByUser,
  editData,
  deleteData,
  createSchedule,
  getDashboardStats
} = require('../Controllers/DataController');

router.post('/add', addData);
router.post('/getByUser', getDataByUser);
router.put('/edit/:id', editData);
router.delete('/delete/:id', deleteData);
router.post('/createSchedule', createSchedule);
router.get('/dashboardStats', getDashboardStats);

module.exports = router;