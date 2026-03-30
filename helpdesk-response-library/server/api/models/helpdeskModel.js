const mongoose = require("mongoose");

const { Schema } = mongoose;
const priorityLevels = ["Low", "Medium", "High", "Critical"];
const auditActions = ["Created", "Updated", "Archived", "Restored"];

const AuditLogSchema = new Schema(
  {
    action: {
      type: String,
      required: true,
      enum: auditActions,
    },
    actor: {
      type: String,
      trim: true,
      default: "System",
      maxlength: [60, "Audit actors should be 60 characters or fewer."],
    },
    summary: {
      type: String,
      required: true,
      trim: true,
      maxlength: [180, "Audit summaries should be 180 characters or fewer."],
    },
    changedFields: {
      type: [String],
      default: [],
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: false,
  }
);

const HelpdeskSchema = new Schema(
  {
    issueCode: {
      type: String,
      required: [true, "Issue code is required."],
      trim: true,
      uppercase: true,
      unique: true,
      match: [
        /^[A-Z0-9_]+$/,
        "Issue code can only contain letters, numbers and underscores.",
      ],
    },
    responseText: {
      type: String,
      required: [true, "Response text is required."],
      trim: true,
      minlength: [10, "Response text should be at least 10 characters long."],
    },
    department: {
      type: String,
      required: [true, "Department is required."],
      trim: true,
      maxlength: [40, "Department should be 40 characters or fewer."],
    },
    priority: {
      type: String,
      required: [true, "Priority is required."],
      trim: true,
      enum: {
        values: priorityLevels,
        message: "Priority must be Low, Medium, High, or Critical.",
      },
      default: "Medium",
    },
    tags: {
      type: [String],
      default: [],
      validate: {
        validator(value) {
          return value.length <= 8;
        },
        message: "Use eight tags or fewer per entry.",
      },
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [280, "Notes should be 280 characters or fewer."],
      default: "",
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
    archivedAt: {
      type: Date,
      default: null,
    },
    auditLog: {
      type: [AuditLogSchema],
      default: [],
    },
  },
  {
    timestamps: true,
    collection: "helpdeskEntries",
  }
);

module.exports = mongoose.model("HelpdeskEntry", HelpdeskSchema);
