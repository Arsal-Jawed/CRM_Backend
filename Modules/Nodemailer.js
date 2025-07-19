const nodemailer = require('nodemailer');
require("dotenv").config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'callsidcrm@gmail.com',
    pass: process.env.AppPass
  }
});

const sendMail = (to, subject, htmlContent) => {
  const mailOptions = {
    from: 'CallSid CRM <callsidcrm@gmail.com>',
    to,
    subject,
    text: 'You have received an update related to your CRM account. Please check your email in HTML format to view details.',
    html: htmlContent
  };
  return transporter.sendMail(mailOptions);
};

const getCRMTemplate = (username, userEmail, userPassword, action, details, role) => {
  let roleLabel = role;

  return `
    <div style="font-family:'Segoe UI', sans-serif; max-width:600px; margin:20px auto; border-radius:12px; overflow:hidden; box-shadow:0 0 12px rgba(0,0,0,0.15); border:1px solid #ffa726;">
      <div style="background-color:#fb8c00; color:white; padding:24px; text-align:center;">
        <h1 style="margin:0; font-size:26px;">CallSidd CRM Notification</h1>
        <p style="margin:6px 0 0; font-size:15px;">Account Activity Alert</p>
      </div>

      <div style="padding:24px; background-color:#fffde7;">
        <h2 style="color:#e65100;">Hello, ${username} 👋</h2>
        <p style="font-size:16px; color:#555; margin:10px 0;">
          This is to notify you of the following CRM account activity:
        </p>

        <div style="background-color:#fff3e0; padding:16px; border-left:5px solid #fb8c00; font-size:16px; margin:20px 0; border-radius:6px;">
          <p><strong>🛠 Action:</strong> ${action}</p>
          <p><strong>📝 Details:</strong> ${details}</p>
          <p><strong>👤 Role:</strong> ${roleLabel}</p>
        </div>

        <div style="margin:25px 0;">
          <h3 style="color:#e65100; margin-bottom:10px;">🔐 Your Login Credentials</h3>
          <p style="margin:0; font-size:15px;"><strong>📧 Email:</strong> ${userEmail}</p>
          <p style="margin:5px 0 0; font-size:15px;"><strong>🔑 Password:</strong> ${userPassword}</p>
        </div>

        <p style="font-size:13px; color:#777; margin-top:25px;">
          If you were not expecting this email, please ignore it.<br/>
          We appreciate you being a part of <strong>CallSidd CRM</strong> — your partner in smarter sales.
        </p>
      </div>

      <div style="background-color:#fb8c00; padding:14px; text-align:center;">
        <p style="color:white; font-size:12px; margin:0;">&copy; ${new Date().getFullYear()} CallSidd CRM. All rights reserved.</p>
      </div>
    </div>
  `;
};

const getLeadAssignmentTemplate = (lead, assignedDate, followupDate) => {
  return `
<!DOCTYPE html>
<html>
<head>
    <style>
        body {
            font-family: 'Segoe UI', sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f5f5f5;
        }
    </style>
</head>
<body style="font-family:'Segoe UI', sans-serif; margin:0; padding:0;">
    <div style="max-width:600px; margin:20px auto; border-radius:12px; overflow:hidden; box-shadow:0 0 12px rgba(0,0,0,0.15); border:1px solid #ffa726;">
        <!-- Header -->
        <div style="background-color:#fb8c00; color:white; padding:24px; text-align:center;">
            <h1 style="margin:0; font-size:26px;">CallSidd CRM Notification</h1>
            <p style="margin:6px 0 0; font-size:15px;">New Lead Assignment</p>
        </div>

        <!-- Content -->
        <div style="padding:24px; background-color:#fffde7;">
            <h2 style="color:#e65100; margin:0 0 16px;">Hello there 👋</h2>
            <p style="font-size:16px; color:#555; margin:10px 0 20px;">
                You've been assigned a new lead that requires your attention:
            </p>

            <!-- Lead Card -->
            <div style="background-color:#fff3e0; padding:20px; border-left:5px solid #fb8c00; margin:20px 0; border-radius:6px;">
                <p style="margin:8px 0;"><strong style="color:#e65100;">👤 Client Name:</strong> ${lead.person_name}</p>
                <p style="margin:8px 0;"><strong style="color:#e65100;">🏢 Business Name:</strong> ${lead.business_name}</p>
                <p style="margin:8px 0;"><strong style="color:#e65100;">📧 Client Email:</strong> ${lead.personal_email}</p>
                <p style="margin:8px 0;"><strong style="color:#e65100;">📧 Business Email:</strong> ${lead.business_email || 'N/A'}</p>
                <p style="margin:8px 0;"><strong style="color:#e65100;">📱 Contact:</strong> ${lead.contact}</p>
                <p style="margin:8px 0;"><strong style="color:#e65100;">📅 Assigned On:</strong> ${assignedDate.toLocaleDateString()}</p>
                <p style="margin:8px 0;"><strong style="color:#e65100;">⏰ Follow-Up Date:</strong> ${followupDate.toLocaleDateString()}</p>
            </div>

            <!-- CTA Button -->
            <div style="text-align:center; margin:28px 0;">
                <a href="[YOUR_CRM_DASHBOARD_URL]" style="display:inline-block; background-color:#fb8c00; color:white; text-decoration:none; padding:12px 24px; border-radius:6px; font-weight:500; font-size:15px;">
                    View Lead in CRM
                </a>
            </div>

            <!-- Footer Note -->
            <p style="font-size:13px; color:#777; margin-top:25px; border-top:1px solid #ffe0b2; padding-top:16px;">
                If you were not expecting this email, please contact your manager.<br/>
                We appreciate you being a part of <strong>CallSidd CRM</strong> — your partner in smarter sales.
            </p>
        </div>

        <!-- Footer -->
        <div style="background-color:#fb8c00; padding:14px; text-align:center;">
            <p style="color:white; font-size:12px; margin:0;">&copy; ${new Date().getFullYear()} CallSidd CRM. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
`;
};

module.exports = { sendMail, getCRMTemplate, getLeadAssignmentTemplate };
