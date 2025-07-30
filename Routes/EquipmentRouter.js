const express = require('express');
const router = express.Router();
const {
  addEquipment,
  editEquipment,
  getEquipmentsByClient,
  deleteEquipment,
  createEquipment,
  getEquipmentById,
  getAllEquipments
} = require('../Controllers/EquipmentController');

router.post('/add', addEquipment);
router.post('/create',createEquipment);
router.get('/getEquipById/:id', getEquipmentById);
router.put('/edit/:id', editEquipment);
router.get('/client/:clientId', getEquipmentsByClient);
router.get('/all', getAllEquipments);
router.delete('/deleteEquipment/:id', deleteEquipment);

module.exports = router;