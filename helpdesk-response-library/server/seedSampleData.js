const mongoose = require("mongoose");
const { hashPassword } = require("./api/utils/authUtils");

const mongoUri =
  process.env.MONGO_URI || "mongodb://127.0.0.1:27017/helpdesk_db";

require("./api/models/helpdeskModel");
require("./api/models/userModel");

const HelpdeskEntry = mongoose.model("HelpdeskEntry");
const User = mongoose.model("User");
const createdAt = new Date();

function buildSeedAudit(issueCode) {
  return [
    {
      action: "Created",
      actor: "Seed Script",
      summary: `Entry ${issueCode} was created during sample data seeding.`,
      changedFields: [
        "issueCode",
        "responseText",
        "department",
        "priority",
        "tags",
        "notes",
      ],
      timestamp: createdAt,
    },
  ];
}

const sampleEntries = [
  {
    issueCode: "PWD_RESET",
    department: "IT Support",
    priority: "High",
    tags: ["password", "account", "identity"],
    notes: "Used heavily during onboarding weeks and after company password rotations.",
    auditLog: buildSeedAudit("PWD_RESET"),
    responseText:
      "Ask the user to use the password reset link, confirm their email address, and remind them the link expires in 15 minutes.",
  },
  {
    issueCode: "VPN_DOWN",
    department: "Infrastructure",
    priority: "Critical",
    tags: ["network", "remote-access", "incident"],
    notes: "Escalate quickly if the user reports the outage is affecting multiple staff members.",
    auditLog: buildSeedAudit("VPN_DOWN"),
    responseText:
      "Confirm the user's internet connection first, then guide them through reconnecting to the VPN client and retrying access.",
  },
  {
    issueCode: "BILLING_LATE",
    department: "Finance",
    priority: "Medium",
    tags: ["billing", "payments"],
    notes: "Keep wording neutral and avoid promising fee waivers before a finance review.",
    auditLog: buildSeedAudit("BILLING_LATE"),
    responseText:
      "Advise the customer of the grace period, confirm the outstanding balance, and provide the official payment link.",
  },
  {
    issueCode: "ACCOUNT_LOCK",
    department: "IT Support",
    priority: "High",
    tags: ["security", "account", "access"],
    notes: "Identity verification must be completed before any unlock action is taken.",
    auditLog: buildSeedAudit("ACCOUNT_LOCK"),
    responseText:
      "Verify the caller's identity, unlock the account through the admin console, and ask the user to sign in again.",
  },
  {
    issueCode: "SHIP_DELAY",
    department: "Logistics",
    priority: "Low",
    tags: ["delivery", "courier"],
    notes: "Use this response when a package is still in transit and not officially lost.",
    auditLog: buildSeedAudit("SHIP_DELAY"),
    responseText:
      "Apologise for the delay, provide the latest courier update, and confirm when the next tracking refresh is expected.",
  },
  {
    issueCode: "REFUND_REQ",
    department: "Customer Care",
    priority: "Medium",
    tags: ["refund", "customer-care"],
    notes: "Remind staff to confirm the original payment method before quoting refund timings.",
    auditLog: buildSeedAudit("REFUND_REQ"),
    responseText:
      "Check the order status, explain the refund timeline, and send the customer the refund confirmation reference.",
  },
  {
    issueCode: "MFA_FAIL",
    department: "Security",
    priority: "High",
    tags: ["mfa", "security", "login"],
    notes: "If multiple users are affected, confirm whether the identity provider is degraded.",
    auditLog: buildSeedAudit("MFA_FAIL"),
    responseText:
      "Check whether the user's device clock is correct, confirm they are using the latest authenticator code, and provide backup verification steps if needed.",
  },
  {
    issueCode: "EMAIL_BOUNCE",
    department: "Messaging",
    priority: "Medium",
    tags: ["email", "delivery", "mailbox"],
    notes: "Useful for internal mail flow troubleshooting before escalating to the messaging team.",
    auditLog: buildSeedAudit("EMAIL_BOUNCE"),
    responseText:
      "Review the bounce-back message, confirm the destination address, and advise the sender whether the issue is mailbox-related or domain-related.",
  },
  {
    issueCode: "SOFT_INSTALL",
    department: "Desktop Support",
    priority: "Low",
    tags: ["software", "installation", "device"],
    notes: "Confirm the device is company-managed before approving installation guidance.",
    auditLog: buildSeedAudit("SOFT_INSTALL"),
    responseText:
      "Verify the requested software is approved, confirm the user's device permissions, and guide them through the standard installation package or self-service portal.",
  },
  {
    issueCode: "PRINTER_OFFLINE",
    department: "Office IT",
    priority: "Low",
    tags: ["printer", "office", "hardware"],
    notes: "Check whether the issue affects a single printer or the entire office print queue.",
    auditLog: buildSeedAudit("PRINTER_OFFLINE"),
    responseText:
      "Ask the user to confirm the printer is powered on, connected to the network, and selected correctly, then retry the print job after clearing any stuck queue items.",
  },
  {
    issueCode: "PAYROLL_QUERY",
    department: "HR",
    priority: "Medium",
    tags: ["payroll", "hr", "salary"],
    notes: "Avoid discussing sensitive payroll details until identity verification is completed.",
    auditLog: buildSeedAudit("PAYROLL_QUERY"),
    responseText:
      "Confirm the employee's identity, review the payroll period they are asking about, and direct them to the HR payroll contact if further investigation is required.",
  },
  {
    issueCode: "CRM_TIMEOUT",
    department: "Business Systems",
    priority: "High",
    tags: ["crm", "performance", "timeout"],
    notes: "Track repeated reports because they may indicate a wider application slowdown.",
    auditLog: buildSeedAudit("CRM_TIMEOUT"),
    responseText:
      "Ask the user to retry after a hard refresh, confirm whether the timeout affects one record or the whole system, and capture the time of failure for escalation.",
  },
];

async function seed() {
  try {
    await mongoose.connect(mongoUri);
    await HelpdeskEntry.deleteMany({});
    await User.deleteMany({});
    await HelpdeskEntry.insertMany(sampleEntries);
    const adminPassword = hashPassword("Admin1842!");
    const staffPassword = hashPassword("Staff1842!");
    await User.insertMany([
      {
        username: "admin",
        displayName: "Alex Admin",
        role: "Admin",
        passwordHash: adminPassword.passwordHash,
        passwordSalt: adminPassword.salt,
      },
      {
        username: "staff_demo",
        displayName: "Sam Staff",
        role: "Staff",
        passwordHash: staffPassword.passwordHash,
        passwordSalt: staffPassword.salt,
      },
    ]);
    console.log(`Seeded ${sampleEntries.length} helpdesk entries into ${mongoUri}`);
    console.log("Created seed users: admin / Admin1842! and staff_demo / Staff1842!");
  } catch (error) {
    console.error("Failed to seed sample data.", error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

seed();
