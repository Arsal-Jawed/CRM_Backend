const express = require('express');
const router = express.Router();
const upload = require('../Modules/Multer');
const {createRecord,getAllRecords,getRecordByLead,deleteRecord} = require('../Controllers/RecordController');

// Create new record with file upload
router.post('/createRecord', upload.single('file'), createRecord);

// Get all records
router.get('/getAllRecords', getAllRecords);

// Get records by lead_id
router.get('/getRecordByLead/:lead_id', getRecordByLead);

// Delete record by record_id
router.delete('/deleteRecord/:record_id', deleteRecord);

module.exports = router;