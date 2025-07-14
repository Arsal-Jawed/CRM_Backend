const express = require('express');
const router = express.Router();
const {
  createSale,
  updateApplicationStatus,
  updateLeaseStatus,
  updateCreditScore,
  getSales, editSale
} = require('../Controllers/SaleController');

router.post('/create', createSale);
router.put('/application-status/:id', updateApplicationStatus);
router.put('/lease-status/:id', updateLeaseStatus);
router.put('/credit-score/:id', updateCreditScore);
router.get('/getSales', getSales);
router.put('/editSale/:id', editSale);

module.exports = router;