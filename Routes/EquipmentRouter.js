const express = require('express');
const router = express.Router();
const {
  addEquipment,
  editEquipment,
  getEquipmentsByClient,
  deleteEquipment,
  createEquipment,
  getEquipmentById
} = require('../Controllers/EquipmentController');

router.post('/add', addEquipment);
router.post('/create',createEquipment);
router.get('/getEquipById/:id', getEquipmentById);
router.put('/edit/:id', editEquipment);
router.get('/client/:clientId', getEquipmentsByClient);
router.delete('/deleteEquipment/:id', deleteEquipment);

module.exports = router;