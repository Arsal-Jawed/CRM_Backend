const express = require('express');
const router = express.Router();
const {
  addMsg,
  getAllMsgs,
  getMsgsbyReciever,
  getMsgsbySender,
  markSeen,
  editMsg
} = require('../Controllers/MessageController');

router.post('/addMsg', addMsg);
router.get('/all', getAllMsgs);
router.get('/reciever/:reciever', getMsgsbyReciever);
router.get('/sender/:sender', getMsgsbySender);
router.put('/seen/:messageId', markSeen);
router.put('/edit/:messageId', editMsg);

module.exports = router;