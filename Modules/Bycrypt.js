const bcrypt = require('bcrypt');

const encryptPassword = async (plainPassword) => {
  const salt = await bcrypt.genSalt(10);
  const hashed = await bcrypt.hash(plainPassword, salt);
  return hashed;
};

const comparePassword = async (plainPassword, hashedPassword) => {
  return await bcrypt.compare(plainPassword, hashedPassword);
};

module.exports = { encryptPassword, comparePassword };
