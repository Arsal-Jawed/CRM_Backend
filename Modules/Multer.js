const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Upload directory - yahan MP3 files save hongi
const uploadDir = 'D:/AREX Projects/CRM/Client/crm/public/Records';

// Directory create karein agar nahi hai
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Storage configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Unique filename banayein
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'record-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// File filter - Sirf MP3 files allow karein
const fileFilter = (req, file, cb) => {
    // Allowed extensions - MP3 aur audio formats
    const allowedTypes = /mp3|wav|m4a|ogg|webm/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = file.mimetype.startsWith('audio/');

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Sirf audio files (MP3, WAV, M4A, OGG, WebM) allowed hain!'));
    }
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 },
    fileFilter: fileFilter
});

module.exports = upload;