const path = require('path');
const Doc = require('../Models/DocModel');
const cloudinary = require('../Modules/Cloudinary');
const fs = require('fs');
const db = require('../db');
const User = require('../Models/UserModel');

const addDoc = async (req, res) => {
  try {
    const { clientId, docName, email } = req.body;
    const file = req.file;

    if (!file) return res.status(400).json({ message: 'No file uploaded' });

    const ext = path.extname(file.originalname).toLowerCase();
    let detectedType = 'doc';
    if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) detectedType = 'image';
    else if (ext === '.pdf') detectedType = 'pdf';

    const result = await cloudinary.uploader.upload(file.path, {
  folder: 'Clients',
  resource_type: ext === '.pdf' ? 'raw' : 'auto'
});

    fs.unlinkSync(file.path);

    const newDoc = new Doc({
      clientId,
      docName,
      path: result.secure_url,
      type: detectedType
    });

    await newDoc.save();

    const user = await User.findOne({ email });
    const notifier = user ? `${user.firstName} ${user.lastName}` : email;
    const detail = `Uploaded a new document: *${docName}*`;

    const query = `INSERT INTO notification (notifier, detail, date) VALUES (?, ?, NOW())`;
    db.query(query, [notifier, detail], (err) => {
      if (err) console.error('Failed to insert notification:', err);
    });

    res.status(201).json(newDoc);
  } catch (err) {
    res.status(500).json({ message: 'Failed to upload and save document', error: err });
  }
};

const uploadMultipleDocs = async (req, res) => {
  try {
    const { clientId, email, docNames } = req.body;
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const user = await User.findOne({ email });
    const notifier = user ? `${user.firstName} ${user.lastName}` : email;

    // Ensure docNames is array
    const docNameArray = Array.isArray(docNames) ? docNames : [docNames];
    const savedDocs = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ext = path.extname(file.originalname).toLowerCase();
      let detectedType = 'doc';
      if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) detectedType = 'image';
      else if (ext === '.pdf') detectedType = 'pdf';

      const result = await cloudinary.uploader.upload(file.path, {
        folder: 'Clients',
        resource_type: ext === '.pdf' ? 'raw' : 'auto'
      });

      fs.unlinkSync(file.path);

      const docName = docNameArray[i] || 'Unnamed Document';

      const newDoc = new Doc({
        clientId,
        docName,
        path: result.secure_url,
        type: detectedType
      });

      await newDoc.save();
      savedDocs.push(newDoc);

      const detail = `Uploaded a new document: *${docName}*`;
      const query = `INSERT INTO notification (notifier, detail, date) VALUES (?, ?, NOW())`;
      db.query(query, [notifier, detail], (err) => {
        if (err) console.error('Notification insert error:', err);
      });
    }

    res.status(201).json({ success: true, uploaded: savedDocs });
  } catch (err) {
    res.status(500).json({ message: 'Document upload failed', error: err });
  }
};

const getAllDocs = async (req, res) => {
  try {
    const docs = await Doc.find().sort({ date: -1 });
    res.status(200).json(docs);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch documents', error: err });
  }
};

const getDocsByClient = async (req, res) => {
  try {
    const { lead_id, client_id } = req.query;

    if (!lead_id && !client_id) {
      return res.status(400).json({ message: 'lead_id or client_id is required' });
    }

    const idsToMatch = [];

    if (lead_id) idsToMatch.push(lead_id);
    if (client_id) idsToMatch.push(client_id);

    const docs = await Doc.find({
      clientId: { $in: idsToMatch }
    }).sort({ date: -1 });

    res.status(200).json(docs);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch client documents', error: err });
  }
};


const editDoc = async (req, res) => {
  try {
    const updatedDoc = await Doc.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedDoc) return res.status(404).json({ message: 'Document not found' });
    res.status(200).json(updatedDoc);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update document', error: err });
  }
};

const removeDoc = async (req, res) => {
  try {
    const doc = await Doc.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Document not found' });

    if (doc.public_id) {
      await cloudinary.uploader.destroy(doc.public_id, { resource_type: 'auto' });
    }

    await doc.deleteOne();
    res.status(200).json({ message: 'Document removed successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to remove document', error: err.message });
  }
};

module.exports ={
  addDoc,
  uploadMultipleDocs,
  getAllDocs,
  getDocsByClient,
  editDoc,
  removeDoc
}