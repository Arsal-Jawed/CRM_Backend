const db = require('../db');
const path = require('path');
const fs = require('fs');

// Create a new record
const createRecord = (req, res) => {
    const { lead_id } = req.body;

    // Validation
    if (!lead_id) {
        return res.status(400).json({
            success: false,
            message: "lead_id required hai"
        });
    }

    // Check if file uploaded hai
    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: "File upload karna zaroori hai"
        });
    }

    // Database mein /Records/filename.mp3 format save karein
    const file_path = `/Records/${req.file.filename}`;

    // Pehle check karein ke is lead_id ki record pehle se hai ya nahi
    const checkQuery = `SELECT * FROM record WHERE lead_id = ?`;
    
    db.query(checkQuery, [lead_id], (err, results) => {
        if (err) {
            console.error("Error checking existing record:", err);
            // New file delete kar do kyunki error aa gaya
            fs.unlinkSync(req.file.path);
            return res.status(500).json({
                success: false,
                message: "Record check karte waqt error aaya",
                error: err.message
            });
        }

        // Agar purani record hai toh purani file delete karo
        if (results.length > 0) {
            const oldRecord = results[0];
            // Old file path from DB: /Records/record-xxx.mp3
            // Convert to full path: D:/AREX Projects/CRM/Client/crm/public/Records/record-xxx.mp3
            const oldFileName = oldRecord.file_path.replace('/Records/', '');
            const oldFilePath = path.join('D:', 'AREX Projects', 'CRM', 'Client', 'crm', 'public', 'Records', oldFileName);
            
            // Purani file delete karo (agar exist karti hai)
            if (fs.existsSync(oldFilePath)) {
                try {
                    fs.unlinkSync(oldFilePath);
                    console.log('Old file deleted:', oldFilePath);
                } catch (deleteErr) {
                    console.error('Error deleting old file:', deleteErr);
                }
            }

            // UPDATE query - purani record ko update karo
            const updateQuery = `UPDATE record SET file_path = ? WHERE lead_id = ?`;
            
            db.query(updateQuery, [file_path, lead_id], (err, result) => {
                if (err) {
                    console.error("Error updating record:", err);
                    // New file bhi delete kar do
                    fs.unlinkSync(req.file.path);
                    return res.status(500).json({
                        success: false,
                        message: "Record update karte waqt error aaya",
                        error: err.message
                    });
                }

                res.status(200).json({
                    success: true,
                    message: "Record successfully replace ho gaya",
                    data: {
                        record_id: oldRecord.record_id,
                        lead_id,
                        file_path,
                        file_name: req.file.filename,
                        action: 'replaced'
                    }
                });
            });
        } else {
            // Agar purani record nahi hai toh naya INSERT karo
            const insertQuery = `INSERT INTO record (lead_id, file_path) VALUES (?, ?)`;
            
            db.query(insertQuery, [lead_id, file_path], (err, result) => {
                if (err) {
                    console.error("Error creating record:", err);
                    // New file delete kar do
                    fs.unlinkSync(req.file.path);
                    return res.status(500).json({
                        success: false,
                        message: "Record create karte waqt error aaya",
                        error: err.message
                    });
                }

                res.status(201).json({
                    success: true,
                    message: "Record successfully create ho gaya",
                    data: {
                        record_id: result.insertId,
                        lead_id,
                        file_path,
                        file_name: req.file.filename,
                        action: 'created'
                    }
                });
            });
        }
    });
};

// Get records by lead_id
const getRecordByLead = (req, res) => {
    const { lead_id } = req.params;

    if (!lead_id) {
        return res.status(400).json({
            success: false,
            message: "lead_id required hai"
        });
    }

    const query = `SELECT * FROM record WHERE lead_id = ?`;
    
    db.query(query, [lead_id], (err, results) => {
        if (err) {
            console.error("Error fetching records:", err);
            return res.status(500).json({
                success: false,
                message: "Records fetch karte waqt error aaya",
                error: err.message
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Is lead_id ke liye koi record nahi mila"
            });
        }

        res.status(200).json({
            success: true,
            message: "Records successfully fetch ho gaye",
            count: results.length,
            data: results
        });
    });
};

// Get all records
const getAllRecords = (req, res) => {
    const query = `SELECT * FROM record ORDER BY record_id DESC`;
    
    db.query(query, (err, results) => {
        if (err) {
            console.error("Error fetching all records:", err);
            return res.status(500).json({
                success: false,
                message: "Records fetch karte waqt error aaya",
                error: err.message
            });
        }

        res.status(200).json({
            success: true,
            message: "Sab records successfully fetch ho gaye",
            count: results.length,
            data: results
        });
    });
};

// Delete a record
const deleteRecord = (req, res) => {
    const { record_id } = req.params;

    if (!record_id) {
        return res.status(400).json({
            success: false,
            message: "record_id required hai"
        });
    }

    // First check if record exists
    const checkQuery = `SELECT * FROM record WHERE record_id = ?`;
    
    db.query(checkQuery, [record_id], (err, results) => {
        if (err) {
            console.error("Error checking record:", err);
            return res.status(500).json({
                success: false,
                message: "Record check karte waqt error aaya",
                error: err.message
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Record nahi mila"
            });
        }

        // Delete the record
        const deleteQuery = `DELETE FROM record WHERE record_id = ?`;
        
        db.query(deleteQuery, [record_id], (err, result) => {
            if (err) {
                console.error("Error deleting record:", err);
                return res.status(500).json({
                    success: false,
                    message: "Record delete karte waqt error aaya",
                    error: err.message
                });
            }

            res.status(200).json({
                success: true,
                message: "Record successfully delete ho gaya",
                data: {
                    record_id: record_id
                }
            });
        });
    });
};

module.exports = {
    createRecord,
    getRecordByLead,
    getAllRecords,
    deleteRecord
};