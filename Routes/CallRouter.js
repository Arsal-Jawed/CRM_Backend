const express = require('express');
const router = express.Router();
const {
  createCall,
  getAllCalls,
  getCallsByClientId,
  getCallsByCaller,
  getCallsByCallerAndClientId,
  getCallsByDate,
  editRemarks
} = require('../Controllers/CallController');

router.post('/create', createCall);
router.get('/all', getAllCalls);
router.get('/client/:clientId', getCallsByClientId);
router.get('/caller/:caller', getCallsByCaller);
router.get('/filter/:caller/:clientId', getCallsByCallerAndClientId);
router.get('/date/:date', getCallsByDate);
router.put('/edit/:id', editRemarks);

module.exports = router;
