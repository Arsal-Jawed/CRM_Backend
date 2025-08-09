const Message = require('../Models/MessageModel');
const User = require('../Models/UserModel');

const addMsg = async (req, res) => {
  try {
    const { sender, reciever, subject, message } = req.body;
    const newMsg = await Message.create({ sender, reciever, subject, message });
    res.status(201).json(newMsg);
  } catch (err) {
    res.status(500).json({ error: 'Failed to send message' });
  }
};

const getAllMsgs = async (req, res) => {
  try {
    const messages = await Message.find().sort({ date: -1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
};

const getMsgsbyReciever = async (req, res) => {
  try {
    const { reciever } = req.params;
    const messages = await Message.find({ reciever }).sort({ date: -1 });

    const enrichedMessages = await Promise.all(messages.map(async (msg) => {
      const senderUser = await User.findOne({ email: msg.sender });
      const recieverUser = await User.findOne({ email: msg.reciever });

      const roleMap = {
        1: 'Sales Head',
        2: 'Sales Closure',
        3: 'Lead Gen',
        4: 'Operation Rep',
        5: 'HR Manager',
        6: 'Lead Gen Supervisor'
      };

      return {
        ...msg.toObject(),
        senderName: senderUser ? `${senderUser.firstName} ${senderUser.lastName}` : msg.sender,
        recieverName: recieverUser ? `${recieverUser.firstName} ${recieverUser.lastName}` : msg.reciever,
        senderRole: senderUser ? roleMap[senderUser.role] || 'Unknown' : 'Unknown'
      };
    }));

    res.json(enrichedMessages);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch messages for receiver' });
  }
};



const getMsgsbySender = async (req, res) => {
  try {
    const { sender } = req.params;
    const messages = await Message.find({ sender }).sort({ date: -1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch messages for sender' });
  }
};

const markSeen = async (req, res) => {
  try {
    const { messageId } = req.params;
    const updated = await Message.findOneAndUpdate(
      { messageId },
      { seen: true },
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark message as seen' });
  }
};

const editMsg = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { subject, message } = req.body;
    const updated = await Message.findOneAndUpdate(
      { messageId },
      { subject, message, edited: true },
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to edit message' });
  }
};

module.exports = {
  addMsg,
  getAllMsgs,
  getMsgsbyReciever,
  getMsgsbySender,
  markSeen,
  editMsg
};