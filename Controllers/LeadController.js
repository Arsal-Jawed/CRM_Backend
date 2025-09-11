const Lead = require('../Models/LeadModel');
const User = require('../Models/UserModel');
const FiredUsers = require('../Models/FiredUserModel');
const Rate = require('../Models/RateModel');
const Call = require('../Models/CallModel');
const Doc  = require('../Models/DocModel');
const Sale = require('../Models/SaleModel');
const Team = require('../Models/TeamModel');
const Equipment = require('../Models/Equipment');
const { sendMail, getLeadAssignmentTemplate } = require('../Modules/Nodemailer');

const db = require('../db');

// 1. Create Lead
const createLead = async (req, res) => {
  try {
    const { personal_email, business_name, business_email } = req.body;

    const conditions = [
      { personal_email },
      { business_name }
    ];
    if (business_email) conditions.push({ business_email });

    const existingLead = await Lead.findOne({ $or: conditions });
    if (existingLead) {
      return res.status(400).json({ error: 'Lead already exists' });
    }

    const newLead = new Lead(req.body);
    const savedLead = await newLead.save();

    const { email, person_name, business_name: bName } = savedLead;
    const user = await User.findOne({ email });

    const followupDate = new Date();
    followupDate.setDate(followupDate.getDate() + 2);

    const scheduleDetails = `Call to ${person_name || 'Unknown Client'} of ${bName || 'Unknown Business'} for FollowUp`;

    if (user && (user.role === 1 || user.role === 2)) {
      savedLead.closure1 = user.email;

      // Agar role === 2 hai, to team leader ka email closure2 me dalna hai
      if (user.role === 2 && user.team) {
        const teamData = await Team.findOne({ teamId: user.team });

        if (teamData && teamData.TeamLeader) {
          const teamLeader = await User.findById(teamData.TeamLeader);
          if (teamLeader) {
            savedLead.closure2 = teamLeader.email;
          }
        }
      }

      await savedLead.save();

      const scheduleQuery = `INSERT INTO schedules (scheduler, details, schedule_date) VALUES (?, ?, ?)`;
      db.query(scheduleQuery, ['daniyal.jawed@finnectpos@gmail.com', scheduleDetails, followupDate.toISOString().split('T')[0]]);
      db.query(scheduleQuery, [email, scheduleDetails, followupDate.toISOString().split('T')[0]]);
    }

    if (user) {
      const notifier = `${user.firstName} ${user.lastName}`;
      const detail = `Created a new lead: ${person_name} from ${bName}`;
      const notifyQuery = `INSERT INTO notification (notifier, detail, date) VALUES (?, ?, NOW())`;
      db.query(notifyQuery, [notifier, detail]);
    }

    // Default schedule creation
    const scheduleQuery = `INSERT INTO schedules (scheduler, details, schedule_date) VALUES (?, ?, ?)`;
    db.query(scheduleQuery, ['daniyal.jawed@finnectpos@gmail.com', scheduleDetails, followupDate.toISOString().split('T')[0]]);

    res.status(201).json(savedLead);
  } catch (err) {
    console.error('Error creating lead:', err);
    res.status(500).json({ error: err.message || 'Failed to create lead' });
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
    const { closure1 } = req.body;
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

      const assignDate1 = new Date();
      const followupDate1 = new Date(assignDate1);
      followupDate1.setDate(assignDate1.getDate() + 2);

      updateFields.closure1 = user1.email;
      updateFields.assignDate1 = assignDate1;

      schedules.push({
        scheduler: user1.email,
        details: message,
        schedule_date: followupDate1.toISOString().split('T')[0]
      });

      const html1 = getLeadAssignmentTemplate(lead, assignDate1, followupDate1);
      await sendMail(user1.email, '📋 New Lead Assigned to You', html1);
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

  const requiredDocs = ['Driving License', 'Void Check'];

  // Fetch docs using OR condition on both _id and lead_id
  const uploadedDocs = await Doc.find({
    clientId: { $in: [lead._id.toString(), lead.lead_id.toString()] }
  }).distinct('docName');

  for (let doc of requiredDocs) {
    if (!uploadedDocs.includes(doc)) {
      throw new Error(`Missing required document: ${doc}`);
    }
  }

  const hasEquipment = await Equipment.exists({ clientId: lead.lead_id });
  if (!hasEquipment) throw new Error('Equipment details are required before closing');

  const user = await User.findOne({ email: userEmail });
  if (!user) throw new Error('User not found');

  const hasCall = await Call.exists({ clientId: leadId });
  if (!hasCall) throw new Error('No call log found for this user and client');

  return { lead, user };
};

const validateLostClosure = async (leadId, userEmail) => {
  const lead = await Lead.findById(leadId);
  if (!lead) throw new Error('Lead not found');

  if (lead.rating <= 0) throw new Error('You must rate the lead before closing');
  const hasCall = await Call.exists({ clientId: leadId});
  if (!hasCall) throw new Error('No call log found for this user and client');
}

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
    const updatedLead = await Lead.findByIdAndUpdate(
      req.params.id,
      { status: 'lost', saleCloseDateTime: new Date() },
      { new: true }
    );

    if (!updatedLead) {
      return res.status(404).json({ error: "Lead not found" });
    }

    res.status(200).json(updatedLead);
  } catch (err) {
    res.status(500).json({ error: "Failed to mark lead as lost" });
  }
};


// 8. Get All Leads
const getAllLeads = async (req, res) => {
  try {
    const leads = await Lead.find({});

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

// 8.1. Get All Leads
const getLeads = async (req, res) => {
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
        let user = await User.findOne({ email: lead.email });
        if (!user) {
          user = await FiredUsers.findOne({ email: lead.email });
        }

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

// 13. Get My Clients
const getMyClients = async (req, res) => {
  try {
    const { email } = req.params;

    const leads = await Lead.find({
      $or: [{ closure1: email }, { closure2: email }]
    });

    const leadIds = leads.map(l => l.lead_id?.toString()).filter(Boolean);

    const [sales, equipment] = await Promise.all([
      Sale.find({ clientId: { $in: leadIds } }),
      Equipment.find({ clientId: { $in: leadIds } })
    ]);

    const saleMap = {};
    const equipmentMap = {};

    for (let sale of sales) {
      saleMap[sale.clientId] = sale;
    }

    for (let eq of equipment) {
      const key = eq.clientId;
      if (!equipmentMap[key]) equipmentMap[key] = [];
      equipmentMap[key].push(eq);
    }

    const combined = leads.map(lead => {
      const id = lead.lead_id?.toString();
      return {
        ...lead._doc,
        sale: saleMap[id] || null,
        equipment: equipmentMap[id] || []
      };
    });

    res.json(combined);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 14. Get All Sales
const getAllSales = async (req, res) => {
  try {
    const leads = await Lead.find();

    const leadIds = leads.map(lead => lead.lead_id?.toString()).filter(Boolean);
    const closureEmails = leads.map(lead => lead.closure1).filter(Boolean);

    const [sales, equipment, closureUsers] = await Promise.all([
      Sale.find({ clientId: { $in: leadIds } }),
      Equipment.find({ clientId: { $in: leadIds } }),
      User.find({ email: { $in: closureEmails } })
    ]);

    const saleMap = {};
    const equipmentMap = {};
    const closureMap = {};

    for (let sale of sales) {
      saleMap[sale.clientId] = sale;
    }

    for (let eq of equipment) {
      const key = eq.clientId;
      if (!equipmentMap[key]) equipmentMap[key] = [];
      equipmentMap[key].push(eq);
    }

    for (let user of closureUsers) {
      closureMap[user.email] = `${user.firstName} ${user.lastName}`;
    }

    const combined = leads.map(lead => {
      const id = lead.lead_id?.toString();
      const closure1Name = closureMap[lead.closure1] || 'Not specified';

      return {
        ...lead._doc,
        sale: saleMap[id] || null,
        equipment: equipmentMap[id] || [],
        closure1Name
      };
    });

    res.json(combined);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 15. Add Previous Client
const createClient = async (req, res) => {
  try {
    const {
      email,
      person_name,
      legal_name,
      personal_email,
      contact,
      dob,
      ssn,
      driversLicenseNumber,
      address,
      business_name,
      business_email,
      businessRole,
      business_address,
      business_contact,
      ownershipPercentage,
      established,
      bankName,
      rtn,
      accountNumber
    } = req.body;
    const status = "won";
    const lead = new Lead({
      email,
      person_name,
      legal_name,
      personal_email,
      contact,
      dob,
      ssn,
      driversLicenseNumber,
      address,
      followupDate: new Date(),
      status,
      business_name,
      business_email,
      businessRole,
      business_contact,
      ownershipPercentage,
      established,
      business_address,

      bankName,
      rtn,
      accountNumber,

      closure1: 'not specified'
    });

    await lead.save();
    res.status(201).json({ success: true, lead });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// 16. Update Notes
const updateNotes = async (req, res) => {
  try {
    const { clientId, remarks } = req.body;

    if (!clientId || !remarks) {
      return res.status(400).json({ success: false, error: 'clientId and notes are required' });
    }

    const updatedLead = await Lead.findOneAndUpdate(
      { lead_id: clientId },
      { notes: remarks },
      { new: true }
    );

    if (!updatedLead) {
      return res.status(404).json({ success: false, error: 'Lead not found' });
    }

    res.json({ success: true, message: 'Notes updated successfully', lead: updatedLead });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// 17. Check Lead Existence
const checkLeadExistence = async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ message: 'Query value is required.' });
    }

    const lead = await Lead.findOne({
      $or: [
        { person_name: query },
        { personal_email: query },
        { business_email: query },
        { business_name: query }
      ]
    }).lean();
  //  console.log(lead)
    if (!lead) {
      return res.status(200).json({ exists: false, message: 'Fresh Lead, lead does not exist' });
    }

    const user = await User.findOne({ email: lead.email }).lean();
    const userName = user ? `${user.firstName} ${user.lastName}` : 'User not found';

    return res.status(200).json({
      exists: true,
      name: userName,
      date: lead.date,
      email: lead.email,
      message: 'Lead exists'
    });

  } catch (err) {
    console.error('Error checking lead existence:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// 18. Set Closure 1
const setClosure = async (req, res) => {
  try {
    const { closure1 } = req.body;
    const updateFields = {};
    const schedules = [];

    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ error: 'Lead not found' });

    if (closure1) {
  const user1 = await User.findById(closure1);
  if (!user1) return res.status(404).json({ error: 'Closure 1 user not found' });

  updateFields.closure1 = user1.email;

}
    if (Object.keys(updateFields).length === 0)
      return res.status(400).json({ error: 'No valid data to update' });

    const updatedLead = await Lead.findByIdAndUpdate(req.params.id, updateFields, { new: true });

    res.status(200).json(updatedLead);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to assign follow-up and create schedule' });
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
  updateLeadNotes,
  getMyClients,
  getAllSales,
  createClient,
  updateNotes,
  checkLeadExistence,
  setClosure,
  getLeads
};
