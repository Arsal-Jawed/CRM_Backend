const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

const {
  addDoc,
  uploadMultipleDocs,
  getAllDocs,
  getDocsByClient,
  editDoc,
  removeDoc
} = require('../Controllers/DocController');

router.post('/create', upload.single('file'), addDoc);
router.post('/uploadMultiple', upload.array('files'), uploadMultipleDocs);
router.get('/all', getAllDocs);
router.get('/clientDocs', getDocsByClient);
router.put('/edit/:id', editDoc);
router.delete('/remove/:id', removeDoc);

module.exports = router;