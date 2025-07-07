const Ticket = require('../Models/TicketModel');
const User = require('../Models/UserModel');
const Lead = require('../Models/LeadModel');

const createTicket = async (req, res) => {
  try {
    const { leadId, generatorType, generator, details } = req.body;
    console.log('id: '+leadId+' type: '+generatorType+' generator: '+generator+' details: '+details);
    const ticket = new Ticket({ leadId, generatorType, generator, details });
    await ticket.save();
    res.status(201).json(ticket);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create ticket' });
  }
};

const editDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const { details } = req.body;
    const updated = await Ticket.findByIdAndUpdate(id, { details }, { new: true });
    if (!updated) return res.status(404).json({ error: 'Ticket not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to edit details' });
  }
};

const deleteTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Ticket.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ error: 'Ticket not found' });
    res.json({ message: 'Ticket deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete ticket' });
  }
};

const resolveTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const resolverName = `${user.firstName} ${user.lastName}`;
    const updated = await Ticket.findByIdAndUpdate(
      id,
      { status: 'Resolved', resolver: resolverName, resolveDate: new Date() },
      { new: true }
    );

    if (!updated) return res.status(404).json({ error: 'Ticket not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to resolve ticket' });
  }
};

const getAllTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find().sort({ createdAt: -1 });
    const leadIds = tickets.map(t => t.leadId);
    const leads = await Lead.find({ lead_id: { $in: leadIds } });

    const leadMap = {};
    leads.forEach(lead => {
      leadMap[lead.lead_id] = {
        clientName: lead.person_name,
        businessName: lead.business_name
      };
    });

    const enrichedTickets = tickets.map(ticket => ({
      ...ticket.toObject(),
      clientName: leadMap[ticket.leadId]?.clientName || '',
      businessName: leadMap[ticket.leadId]?.businessName || ''
    }));

    res.json(enrichedTickets);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }
};


module.exports = { createTicket, editDetails, deleteTicket, resolveTicket, getAllTickets };