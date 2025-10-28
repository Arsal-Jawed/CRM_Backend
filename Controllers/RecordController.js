const Record = require('../Models/RecordModel')
const cloudinary = require('../Modules/Cloudinary')

// Create or replace record
const createRecord = async (req, res) => {
  try {
    const { lead_id } = req.body
    if (!lead_id) return res.status(400).json({ success: false, message: 'lead_id required hai' })
    if (!req.file) return res.status(400).json({ success: false, message: 'File upload karna zaroori hai' })

    const uploadResult = await cloudinary.uploader.upload(req.file.path, {
      folder: 'crm_audio_records',
      resource_type: 'video'
    })

    let record = await Record.findOne({ lead_id })

    if (record) {
      const oldPublicId = record.file_path.split('/').pop().split('.')[0]
      await cloudinary.uploader.destroy(`crm_audio_records/${oldPublicId}`, { resource_type: 'video' })
      record.file_path = uploadResult.secure_url
      await record.save()
      return res.status(200).json({ success: true, message: 'Record replaced', data: record })
    }

    record = await Record.create({ lead_id, file_path: uploadResult.secure_url })
    res.status(201).json({ success: true, message: 'Record created', data: record })
  } catch (err) {
    console.error('Error:', err)
    res.status(500).json({ success: false, message: 'Server error', error: err.message })
  }
}

// Get record by lead_id
const getRecordByLead = async (req, res) => {
  try {
    const { lead_id } = req.params
    if (!lead_id) return res.status(400).json({ success: false, message: 'lead_id required hai' })

    const records = await Record.find({ lead_id })
    if (!records.length) return res.status(404).json({ success: false, message: 'Is lead_id ke liye koi record nahi mila' })

    res.status(200).json({ success: true, message: 'Records fetched', count: records.length, data: records })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Record fetch karte waqt error aaya', error: err.message })
  }
}

// Get all records
const getAllRecords = async (req, res) => {
  try {
    const records = await Record.find().sort({ createdAt: -1 })
    res.status(200).json({ success: true, message: 'Sab records fetched', count: records.length, data: records })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Records fetch karte waqt error aaya', error: err.message })
  }
}

// Delete record
const deleteRecord = async (req, res) => {
  try {
    const { record_id } = req.params
    if (!record_id) return res.status(400).json({ success: false, message: 'record_id required hai' })

    const record = await Record.findById(record_id)
    if (!record) return res.status(404).json({ success: false, message: 'Record nahi mila' })

    const publicId = record.file_path.split('/').pop().split('.')[0]
    await cloudinary.uploader.destroy(`crm_audio_records/${publicId}`, { resource_type: 'video' })
    await Record.findByIdAndDelete(record_id)

    res.status(200).json({ success: true, message: 'Record deleted', data: { record_id } })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Record delete karte waqt error aaya', error: err.message })
  }
}

module.exports = { createRecord, getRecordByLead, getAllRecords, deleteRecord }