const express = require('express');
const router = express.Router();
const {
  createLead,
  editLead,
  rateLead,
  assignLead,
  wonLead,
  lossLead,
  getAllLeads,
  getLeadsByEmail,
  assignSecondClosure,
  getLeadsByClosure,
  updateClientRating,
  updateLeadNotes,
  getMyClients,
  getAllSales,
  createClient,
  updateNotes,
  checkLeadExistence,
  setClosure,
  getLeads,
  updateFollowupDate
} = require('../Controllers/LeadController');

router.post('/create', createLead);
router.put('/edit/:id', editLead);
router.put('/rate/:id', rateLead);
router.put('/assign/:id', assignLead);
router.put('/assignSecond/:id', assignSecondClosure);
router.put('/won/:id', wonLead);
router.put('/loss/:id', lossLead);
router.get('/all', getAllLeads);
router.get('/allLeads', getLeads);
router.get('/email/:email', getLeadsByEmail);
router.get('/getByClosure/:email', getLeadsByClosure);
router.put('/rateClient/:id', updateClientRating);
router.put('/notes/:id', updateLeadNotes);
router.get('/getMyClients/:email', getMyClients);
router.get('/allClients',getAllSales);
router.post('/createClient', createClient);
router.post('/notes', updateNotes);
router.post('/check-lead', checkLeadExistence);
router.put('/setClosure/:id', setClosure);
router.put('/updateFollowupDate/:id', updateFollowupDate);

module.exports = router;