const db = require('../db');

const createRecordTable = () => {
    
    const query = `
        CREATE TABLE IF NOT EXISTS record (
            record_id INT AUTO_INCREMENT PRIMARY KEY,
            lead_id INT NOT NULL,
            file_path VARCHAR(500) NOT NULL
        )
    `;

    db.query(query, (err, result) => {
        if (err) {
            console.error("Error creating record table:", err);
            throw err;
        }
        console.log("Record table is ready.");
    });
};

module.exports = { createRecordTable };