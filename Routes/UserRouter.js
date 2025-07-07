const express = require('express');
const multer = require('multer');
const path = require('path');

const {
  createUser,
  editUser,
  getAllUsers,
  deleteUser,
  loginUser,
  getAllFiredUsers,
  getUserStats,
  getUsersWithoutTeam,
  getUsersByTeamId
} = require('../Controllers/UserController');

const router = express.Router();
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'tempUploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

router.post('/createUser', upload.single('profilePic'), createUser);
router.post('/login', loginUser);
router.put('/editUser/:id', upload.single('profilePic'),editUser);
router.get('/getAllUsers', getAllUsers);
router.get('/getAllFiredUsers', getAllFiredUsers);
router.get('/getUserStats', getUserStats);
router.delete('/deleteUser/:id', deleteUser);
router.get('/without-team', getUsersWithoutTeam);
router.get('/team-members/:teamId', getUsersByTeamId);

module.exports = router;