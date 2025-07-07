const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

const {
  addDoc,
  getAllDocs,
  getDocsByClient,
  editDoc,
  removeDoc
} = require('../Controllers/DocController');

router.post('/create', upload.single('file'), addDoc);
router.get('/all', getAllDocs);
router.get('/clientDocs/:clientId', getDocsByClient);
router.put('/edit/:id', editDoc);
router.delete('/remove/:id', removeDoc);

module.exports = router;
