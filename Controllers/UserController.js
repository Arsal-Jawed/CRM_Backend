const fs = require('fs');
const User = require('../Models/UserModel');
const FiredUsers = require("../Models/FiredUserModel");
const cloudinary = require('../Modules/Cloudinary');
const { sendMail, getCRMTemplate } = require('../Modules/Nodemailer');
const { encryptPassword,comparePassword } = require('../Modules/Bycrypt');

const createUser = async (req, res) => {
  try {
    const { password, ...rest } = req.body;
    const hashedPassword = await encryptPassword(password);

    let profilePicPath = '';

    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'profilePics'
      });
      profilePicPath = `this path/${result.secure_url}`;
      fs.unlinkSync(req.file.path); // Remove temp file from server
    }

    const newUser = new User({
      ...rest,
      password: hashedPassword,
      profilePic: profilePicPath
    });

    await newUser.save();

    const html = getCRMTemplate(
      newUser.firstName,
      newUser.email,
      password,
      'Account Created',
      'Your CRM account has been successfully created. You can now log in using the credentials below.',
      newUser.designation
    );

    await sendMail(newUser.email, '✅ CRM Account Created', html);
    res.status(201).json(newUser);

  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

    res.status(200).json({ message: 'Login successful', user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const editUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const updates = { ...req.body };

    if (updates.password) {
      updates.password = await encryptPassword(updates.password);
    }

    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'profilePics'
      });
      updates.profilePic = `${result.secure_url}`;
      fs.unlinkSync(req.file.path);
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updates, { new: true });
    if (!updatedUser) return res.status(404).json({ message: 'User not found' });
    
    const html = getCRMTemplate(
      updatedUser.firstName,
      updatedUser.email,
      req.body.password || '********',
      'Account Updated',
      'Your CRM account details have been updated. If you did not request this change, contact your admin.',
      updatedUser.designation
    );

    await sendMail(updatedUser.email, '✏️ CRM Account Updated', html);
    res.status(200).json(updatedUser);

  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ role: { $ne: 81 } })
    res.status(200).json(users)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

const deleteUser = async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    if (!deletedUser) return res.status(404).json({ message: 'User not found' });

    const firedUser = new FiredUsers({
      firstName: deletedUser.firstName,
      lastName: deletedUser.lastName,
      email: deletedUser.email,
      password: deletedUser.password,
      role: deletedUser.role,
      designation: deletedUser.designation,
      contact: deletedUser.contact,
      team: deletedUser.team,
      joining_date: deletedUser.joining_date,
      verified: deletedUser.verified
    });

    await firedUser.save();

    const html = getCRMTemplate(
      deletedUser.firstName,
      deletedUser.email,
      '********',
      'Account Deleted',
      'You are Fired from CallSidd and, your CRM account has been deleted. Good Luck!',
      'terminated'
    );

    await sendMail(deletedUser.email, '❌ CRM Account Deleted', html);

    res.status(200).json({ message: 'User deleted and archived successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getAllFiredUsers = async (req, res) => {
  try {
    const firedUsers = await FiredUsers.find().sort({ joining_date: 1 });
    res.status(200).json(firedUsers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getUserStats = async (req, res) => {
  try {
    const users = await User.find();
    const firedUsers = await FiredUsers.find();

    const stats = {
      total: users?.filter(u => u.role != 81).length || 0,
      managers: users?.filter(u => u.role === 1).length || 0,
      salesClosures: users?.filter(u => u.role === 2).length + users?.filter(u => u.role === 6).length || 0,
      leadGens: users?.filter(u => u.role === 3).length || 0,
      operations: users?.filter(u => u.role === 4).length + users?.filter(u => u.role === 5).length || 0,
      fired: firedUsers?.length || 0
    };
    res.status(200).json(stats);
  } catch (err) {
    console.error("Stats Fetch Error:", err.message);
    res.status(500).json({ error: err.message });
  }
};

const getUsersWithoutTeam = async (req, res) => {
  try {
    const users = await User.find({ team: 0 });
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users without team' });
  }
};

const getUsersByTeamId = async (req, res) => {
  const { teamId } = req.params;

  try {
    const members = await User.find({ team: parseInt(teamId) });
    const formatted = members.map(u => ({
      id: u._id,
      email: u.email,
      name: `${u.firstName} ${u.lastName}`,
      designation: u.designation,
      role: u.role
    }));
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch team members' });
  }
};

const getUsersByRole = async (req, res) => {
  const { role } = req.params;

  try {
    const users = await User.find({ role: role.toString() });

    const formatted = users.map(u => ({
      id: u._id,
      email: u.email,
      name: `${u.firstName} ${u.lastName}`,
      designation: u.designation,
      role: u.role
    }));

    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users by role' });
  }
};

const editFiredUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedUser = await FiredUsers.findByIdAndUpdate(id, req.body, { new: true });
    if (!updatedUser) return res.status(404).json({ message: "Fired user not found" });
    res.json(updatedUser);
  } catch (err) {
    res.status(500).json({ message: "Error updating fired user", error: err.message });
  }
};

module.exports = { createUser, loginUser, editUser, getAllUsers, deleteUser, getAllFiredUsers, getUserStats, getUsersWithoutTeam, getUsersByTeamId, getUsersByRole, editFiredUser }
