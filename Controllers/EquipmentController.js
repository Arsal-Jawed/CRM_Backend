const Equipment = require('../Models/Equipment');

const addEquipment = async (req, res) => {
  try {
    const { clientId, ...rest } = req.body;

    const existing = await Equipment.findOne({ clientId });

    if (existing) {
      Object.assign(existing, rest);
      await existing.save();
      return res.status(200).json(existing);
    }

    const equipment = new Equipment(req.body);
    await equipment.save();
    res.status(201).json(equipment);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
const createEquipment = async (req, res) => {
  try {
    const equipment = new Equipment(req.body);
    await equipment.save();
    res.status(201).json(equipment);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
const editEquipment = async (req, res) => {
  try {
    const updated = await Equipment.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ error: 'Equipment not found' });
    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const getEquipmentsByClient = async (req, res) => {
  try {
    const equipments = await Equipment.find({ clientId: req.params.clientId });
    res.json(equipments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteEquipment = async (req, res) => {
  try {
    const eq = await Equipment.findByIdAndDelete(req.params.id);
    if (!eq) {
      return res.status(404).json({ error: 'Equipment not found' });
    }
    res.json({ message: 'Equipment deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getEquipmentById = async (req, res) => {
  try {
    const equipment = await Equipment.findById(req.params.id);
    console.log('Equipment API Called: ',equipment);
    if (!equipment) return res.status(404).json({ error: 'Equipment not found' });
    res.status(200).json(equipment);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports = {
  addEquipment,
  editEquipment,
  getEquipmentsByClient,
  deleteEquipment,
  createEquipment,
  getEquipmentById
};