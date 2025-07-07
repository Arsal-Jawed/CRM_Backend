const express = require('express');
const router = express.Router();
const {
  createTicket,
  editDetails,
  deleteTicket,
  resolveTicket,
  getAllTickets
} = require('../Controllers/TicketController');

router.post('/create', createTicket);
router.put('/edit/:id', editDetails);
router.delete('/delete/:id', deleteTicket);
router.put('/resolve/:id', resolveTicket);
router.get('/getTickets',getAllTickets);

module.exports = router;
