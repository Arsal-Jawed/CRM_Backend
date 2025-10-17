const multer = require('multer')
const path = require('path')
const fs = require('fs')

// public/Records ko relative bana de taake har system pe chale
const uploadDir = path.join(__dirname, '../Client/crm/public/Records')

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true })
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir)
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, 'record-' + uniqueSuffix + path.extname(file.originalname))
    }
})

const fileFilter = (req, file, cb) => {
    const allowedTypes = /mp3|wav|m4a|ogg|webm/
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
    const mimetype = file.mimetype.startsWith('audio/')

    if (mimetype && extname) cb(null, true)
    else cb(new Error('Sirf audio files (MP3, WAV, M4A, OGG, WebM) allowed hain!'))
}

const upload = multer({
    storage,
    limits: { fileSize: 50 * 1024 * 1024 },
    fileFilter
})

module.exports = upload