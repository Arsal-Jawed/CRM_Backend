const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('./Cloudinary');

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: 'CRM_Records',
    resource_type: 'auto',
    public_id: `record-${Date.now()}-${Math.round(Math.random() * 1e9)}`,
    allowed_formats: ['mp3', 'wav', 'm4a', 'ogg', 'webm']
  }),
});

const fileFilter = (req, file, cb) => {
  const allowed = /mp3|wav|m4a|ogg|webm/;
  const extname = allowed.test(file.originalname.toLowerCase());
  const mimetype = file.mimetype.startsWith('audio/');
  if (mimetype && extname) cb(null, true);
  else cb(new Error('Sirf audio files (MP3, WAV, M4A, OGG, WebM) allowed hain!'));
};

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter
});

module.exports = upload;