const Lead = require('../Models/LeadModel');
const User = require('../Models/UserModel');
const Rate = require('../Models/RateModel');
const Call = require('../Models/CallModel');
const Doc  = require('../Models/DocModel');
const Sale = require('../Models/SaleModel');
const db = require('../db');

// 1. Create Lead
const createLead = async (req, res) => {
  try {
    const { personal_email, business_name, business_email } = req.body;

    const existingLead = await Lead.findOne({
      $or: [
        { personal_email },
        { business_name },
        { business_email: business_email || null }
      ]
    });

    if (existingLead) {
      return res.status(400).json({ error: 'Lead already exists' });
    }

    const newLead = new Lead(req.body);
    const savedLead = await newLead.save();

    const { email, person_name } = savedLead;
    const user = await User.findOne({ email });

    const notifier = `${user.firstName} ${user.lastName}`;
    const detail = `Created a new lead: ${person_name} from ${business_name}`;

    const notifyQuery = `INSERT INTO notification (notifier, detail, date) VALUES (?, ?, NOW())`;
    db.query(notifyQuery, [notifier, detail], (err) => {
      if (err) console.error('Failed to insert notification:', err);
    });

    const followupDate = new Date();
    followupDate.setDate(followupDate.getDate() + 2);

    const scheduleDetails = `Call to ${person_name || 'Unknown Client'} of ${business_name || 'Unknown Business'} for FollowUp`;
    const scheduleQuery = `INSERT INTO schedules (scheduler, details, schedule_date) VALUES (?, ?, ?)`;

    db.query(scheduleQuery, ['arsaljawed9090@gmail.com', scheduleDetails, followupDate.toISOString().split('T')[0]], (err) => {
      if (err) console.error('Failed to insert schedule:', err);
    });

    res.status(201).json(savedLead);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create lead' });
  }
};


// 2. Edit Lead
const editLead = async (req, res) => {
  try {
    const updatedLead = await Lead.findByIdAndUpdate(req.params.id, req.body, { new: true });

    const { email, person_name, business_name } = updatedLead;

    const user = await User.findOne({ email });
    const notifier = `${user.firstName} ${user.lastName}`;
    const detail = `Edited lead: ${person_name} from ${business_name}`;

    const query = `INSERT INTO notification (notifier, detail, date) VALUES (?, ?, NOW())`;
    db.query(query, [notifier, detail], (err) => {
      if (err) console.error('Failed to insert notification:', err);
    });

    res.status(200).json(updatedLead);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update lead' });
  }
};

// 3. Rate Lead
const rateLead = async (req, res) => {
  try {
    const { rating, ratedBy } = req.body;

    const updatedLead = await Lead.findByIdAndUpdate(
      req.params.id,
      {
        rating,
        ratedBy,
        ratingDate: new Date()
      },
      { new: true }
    );

    const user = await User.findOne({ email: ratedBy });
    const notifier = `${user.firstName} ${user.lastName}`;
    const detail = `Rated lead: ${updatedLead.person_name} from ${updatedLead.business_name} with ${rating} star(s)`;

    const query = `INSERT INTO notification (notifier, detail, date) VALUES (?, ?, NOW())`;
    db.query(query, [notifier, detail], (err) => {
      if (err) console.error('Failed to insert notification:', err);
    });

    res.status(200).json(updatedLead);
  } catch (err) {
    res.status(500).json({ error: 'Failed to rate lead' });
  }
};

// 4. Assign Follow-Up
const assignLead = async (req, res) => {
  try {
    const { closure1, closure2 } = req.body;
    const updateFields = {};
    const schedules = [];

    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ error: 'Lead not found' });

    const clientName = lead.person_name || 'Unknown Client';
    const businessName = lead.business_name || 'Unknown Business';

    const message = `Call to ${clientName} of ${businessName} for FollowUp`;

    if (closure1) {
      const user1 = await User.findById(closure1);
      if (!user1) return res.status(404).json({ error: 'Closure 1 user not found' });
      updateFields.closure1 = user1.email;
      updateFields.assignDate1 = new Date();

      const followupDate1 = new Date();
      followupDate1.setDate(followupDate1.getDate() + 2);

      schedules.push({
        scheduler: user1.email,
        details: message,
        schedule_date: followupDate1.toISOString().split('T')[0]
      });
    }

    if (closure2) {
      const user2 = await User.findById(closure2);
      if (!user2) return res.status(404).json({ error: 'Closure 2 user not found' });
      updateFields.closure2 = user2.email;
      updateFields.assignDate2 = new Date();

      const followupDate2 = new Date();
      followupDate2.setDate(followupDate2.getDate() + 2);

      schedules.push({
        scheduler: user2.email,
        details: message,
        schedule_date: followupDate2.toISOString().split('T')[0]
      });
    }

    if (Object.keys(updateFields).length === 0)
      return res.status(400).json({ error: 'No valid data to update' });

    const updatedLead = await Lead.findByIdAndUpdate(req.params.id, updateFields, { new: true });

    for (const sched of schedules) {
      await db.query(
        `INSERT INTO schedules (scheduler, details, schedule_date) VALUES (?, ?, ?)`,
        [sched.scheduler, sched.details, sched.schedule_date]
      );
    }

    res.status(200).json(updatedLead);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to assign follow-up and create schedule' });
  }
};

// 5. Assign Second Follow-Up
const assignSecondClosure = async (req, res) => {
  try {
    const { userId } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const updatedLead = await Lead.findByIdAndUpdate(
      req.params.id,
      {
        closure2: user.email,
        assignDate2: new Date()
      },
      { new: true }
    );

    res.status(200).json(updatedLead);
  } catch (err) {
    res.status(500).json({ error: 'Failed to assign follow-up' });
  }
};

const validateLeadForClosure = async (leadId, userEmail) => {
  const lead = await Lead.findById(leadId);
  if (!lead) throw new Error('Lead not found');

  if (lead.rating <= 0) throw new Error('You must rate the lead before closing');

  const requiredDocs = ['Driving License', 'Application Form', 'Void Check'];
  const uploadedDocs = await Doc.find({ clientId: leadId }).distinct('docName');
  for (let doc of requiredDocs) {
    if (!uploadedDocs.includes(doc)) throw new Error(`Missing required document: ${doc}`);
  }

  const user = await User.findOne({ email: userEmail });
  if (!user) throw new Error('User not found');

  const hasCall = await Call.exists({ clientId: leadId});
  if (!hasCall) throw new Error('No call log found for this user and client');

  return { lead, user };
};

// 6. Mark Lead as Won
const wonLead = async (req, res) => {
  try {
    const { user } = req.body;
    const { lead } = await validateLeadForClosure(req.params.id, user);

    const updatedLead = await Lead.findByIdAndUpdate(
      lead._id,
      { status: 'won', saleCloseDateTime: new Date() },
      { new: true }
    );

    const newSale = new Sale({
      clientId: lead.lead_id,
      currentStatus: 'New'
    });
    await newSale.save();

    const notifierUser = await User.findOne({ email: user });
    const notifier = notifierUser ? `${notifierUser.firstName} ${notifierUser.lastName}` : user;
    const detail = `Marked lead as *Won*: ${updatedLead.person_name} from ${updatedLead.business_name}`;
    const query = `INSERT INTO notification (notifier, detail, date) VALUES (?, ?, NOW())`;

    db.query(query, [notifier, detail], (err) => {
      if (err) console.error('Failed to insert notification:', err);
    });

    res.status(200).json({ updatedLead, sale: newSale });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// 7. Mark Lead as Lost
const lossLead = async (req, res) => {
  try {
    const { user } = req.body;
    const { lead } = await validateLeadForClosure(req.params.id, user);

    const updatedLead = await Lead.findByIdAndUpdate(
      lead._id,
      { status: 'lost', saleCloseDateTime: new Date() },
      { new: true }
    );

    const notifierUser = await User.findOne({ email: user });
    const notifier = notifierUser ? `${notifierUser.firstName} ${notifierUser.lastName}` : user;
    const detail = `Marked lead as *Lost*: ${updatedLead.person_name} from ${updatedLead.business_name}`;
    const query = `INSERT INTO notification (notifier, detail, date) VALUES (?, ?, NOW())`;
    db.query(query, [notifier, detail], (err) => {
      if (err) console.error('Failed to insert notification:', err);
    });

    res.status(200).json(updatedLead);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// 8. Get All Leads
const getAllLeads = async (req, res) => {
  try {
    const leads = await Lead.find();

    const enrichedLeads = await Promise.all(
      leads.map(async (lead) => {
        const user = await User.findOne({ email: lead.email });
        const fullName = user ? `${user.firstName} ${user.lastName}` : 'Unknown User';
        return { ...lead.toObject(), userName: fullName };
      })
    );

    res.status(200).json(enrichedLeads);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch leads' });
  }
};

// 9. Get Leads by Email
const getLeadsByEmail = async (req, res) => {
  try {
    const leads = await Lead.find({ email: req.params.email });
    res.status(200).json(leads);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch leads by email' });
  }
};

// 10. Get Leads by Closures
const getLeadsByClosure = async (req, res) => {
  const { email } = req.params;

  try {
    const leads = await Lead.find({
      $or: [{ closure1: email }, { closure2: email }]
    });

    const enhancedLeads = await Promise.all(
      leads.map(async (lead) => {
        const user = await User.findOne({ email: lead.email });
        const lead_gen = user ? `${user.firstName} ${user.lastName}` : 'Unknown';

        return {
          ...lead.toObject(),
          lead_gen
        };
      })
    );

    res.status(200).json(enhancedLeads);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch leads', error: error.message });
  }
};

// 11. Update Client Rating
const updateClientRating = async (req, res) => {
  const { id } = req.params;
  const { rating } = req.body;

  try {
    const updated = await Lead.findByIdAndUpdate(
      id,
      {
        rating,
        ratingDate: new Date()
      },
      { new: true }
    );

    if (!updated) return res.status(404).json({ message: 'Client not found' });

    res.status(200).json({ message: 'Rating updated', lead: updated });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// 12. Update Internal Notes
const updateLeadNotes = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const updatedLead = await Lead.findByIdAndUpdate(
      id,
      { notes },
      { new: true }
    );

    if (!updatedLead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    res.json(updatedLead);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

module.exports = {
  createLead,
  editLead,
  rateLead,
  assignLead,
  wonLead,
  lossLead,
  getAllLeads,
  getLeadsByEmail,
  assignSecondClosure,
  getLeadsByClosure,
  updateClientRating,
  updateLeadNotes
};
