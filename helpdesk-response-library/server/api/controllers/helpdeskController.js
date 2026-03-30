const mongoose = require("mongoose");

const HelpdeskEntry = mongoose.model("HelpdeskEntry");
const priorityLevels = ["Low", "Medium", "High", "Critical"];

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normaliseTags(tags) {
  const values = Array.isArray(tags) ? tags : String(tags || "").split(",");

  return [...new Set(
    values
      .map((tag) => String(tag || "").trim())
      .filter(Boolean)
      .map((tag) => tag.slice(0, 24))
  )].slice(0, 8);
}

function normalisePriority(priority) {
  const value = String(priority || "").trim().toLowerCase();

  if (!value) {
    return "Medium";
  }

  const matchedPriority = priorityLevels.find(
    (level) => level.toLowerCase() === value
  );

  return matchedPriority || String(priority || "").trim();
}

function normaliseEntryPayload(body) {
  return {
    issueCode: (body.issueCode || "").trim().toUpperCase().replace(/\s+/g, "_"),
    responseText: (body.responseText || "").trim(),
    department: (body.department || "").trim(),
    priority: normalisePriority(body.priority),
    tags: normaliseTags(body.tags),
    notes: (body.notes || "").trim(),
  };
}

function getAuditActor(req) {
  return (
    String(
      (req.authUser && (req.authUser.displayName || req.authUser.username)) || "System"
    ).trim() || "System"
  );
}

function buildAuditEvent(action, actor, summary, changedFields) {
  return {
    action,
    actor,
    summary,
    changedFields: changedFields || [],
    timestamp: new Date(),
  };
}

function describeChangedFields(previousEntry, nextEntry) {
  const fields = ["issueCode", "responseText", "department", "priority", "notes"];
  const changedFields = fields.filter(
    (field) => String(previousEntry[field] || "") !== String(nextEntry[field] || "")
  );

  const previousTags = JSON.stringify(previousEntry.tags || []);
  const nextTags = JSON.stringify(nextEntry.tags || []);

  if (previousTags !== nextTags) {
    changedFields.push("tags");
  }

  return changedFields;
}

function buildFilters(query) {
  const filters = {};
  const search = (query.search || "").trim();
  const department = (query.department || "").trim();
  const priority = (query.priority || "").trim();
  const status = (query.status || "").trim().toLowerCase();

  if (department) {
    filters.department = department;
  }

  if (priority) {
    filters.priority = normalisePriority(priority);
  }

  if (status === "active") {
    filters.isArchived = false;
  }

  if (status === "archived") {
    filters.isArchived = true;
  }

  if (search) {
    const safeSearch = escapeRegex(search);
    filters.$or = [
      { issueCode: new RegExp(safeSearch, "i") },
      { responseText: new RegExp(safeSearch, "i") },
      { department: new RegExp(safeSearch, "i") },
      { priority: new RegExp(safeSearch, "i") },
      { notes: new RegExp(safeSearch, "i") },
      { tags: new RegExp(safeSearch, "i") },
    ];
  }

  return filters;
}

function sendError(res, error, defaultMessage) {
  if (error.name === "ValidationError") {
    const details = Object.values(error.errors).map((entry) => entry.message);
    return res.status(400).json({
      message: "Validation failed.",
      details,
    });
  }

  if (error.code === 11000) {
    return res.status(409).json({
      message: "That issue code already exists. Please use a unique code.",
    });
  }

  if (error.name === "CastError") {
    return res.status(400).json({
      message: "Invalid entry ID supplied.",
    });
  }

  return res.status(500).json({
    message: defaultMessage,
    error: error.message,
  });
}

exports.list_all_entries = async (req, res) => {
  try {
    const entries = await HelpdeskEntry.find(buildFilters(req.query)).sort({
      department: 1,
      issueCode: 1,
    });

    res.json(entries);
  } catch (error) {
    sendError(res, error, "Unable to retrieve helpdesk entries.");
  }
};

exports.create_a_entry = async (req, res) => {
  try {
    const payload = normaliseEntryPayload(req.body);
    const actor = getAuditActor(req);
    const entry = new HelpdeskEntry({
      ...payload,
      auditLog: [
        buildAuditEvent(
          "Created",
          actor,
          `Entry ${payload.issueCode || "NEW_ENTRY"} was created by ${actor}.`,
          ["issueCode", "responseText", "department", "priority", "tags", "notes"]
        ),
      ],
    });
    const savedEntry = await entry.save();
    res.status(201).json(savedEntry);
  } catch (error) {
    sendError(res, error, "Unable to create the helpdesk entry.");
  }
};

exports.read_a_entry = async (req, res) => {
  try {
    const entry = await HelpdeskEntry.findById(req.params.entryId);

    if (!entry) {
      return res.status(404).json({
        message: "Helpdesk entry not found.",
      });
    }

    res.json(entry);
  } catch (error) {
    sendError(res, error, "Unable to retrieve the helpdesk entry.");
  }
};

exports.update_a_entry = async (req, res) => {
  try {
    const existingEntry = await HelpdeskEntry.findById(req.params.entryId);

    if (!existingEntry) {
      return res.status(404).json({
        message: "Helpdesk entry not found.",
      });
    }

    const payload = normaliseEntryPayload(req.body);
    const changedFields = describeChangedFields(existingEntry, payload);
    const actor = getAuditActor(req);

    existingEntry.set(payload);
    existingEntry.auditLog.push(
      buildAuditEvent(
        "Updated",
        actor,
        changedFields.length
          ? `${actor} updated ${changedFields.join(", ")}.`
          : `${actor} saved the entry without material field changes.`,
        changedFields
      )
    );

    const updatedEntry = await existingEntry.save();
    res.json(updatedEntry);
  } catch (error) {
    sendError(res, error, "Unable to update the helpdesk entry.");
  }
};

exports.delete_a_entry = async (req, res) => {
  try {
    const archivedEntry = await HelpdeskEntry.findById(req.params.entryId);

    if (!archivedEntry) {
      return res.status(404).json({
        message: "Helpdesk entry not found.",
      });
    }

    const actor = getAuditActor(req);
    archivedEntry.isArchived = true;
    archivedEntry.archivedAt = new Date();
    archivedEntry.auditLog.push(
      buildAuditEvent(
        "Archived",
        actor,
        `${actor} archived ${archivedEntry.issueCode}.`,
        ["isArchived", "archivedAt"]
      )
    );

    await archivedEntry.save();
    res.json({
      message: "Helpdesk entry archived successfully.",
      entry: archivedEntry,
    });
  } catch (error) {
    sendError(res, error, "Unable to archive the helpdesk entry.");
  }
};

exports.restore_a_entry = async (req, res) => {
  try {
    const restoredEntry = await HelpdeskEntry.findById(req.params.entryId);

    if (!restoredEntry) {
      return res.status(404).json({
        message: "Helpdesk entry not found.",
      });
    }

    const actor = getAuditActor(req);
    restoredEntry.isArchived = false;
    restoredEntry.archivedAt = null;
    restoredEntry.auditLog.push(
      buildAuditEvent(
        "Restored",
        actor,
        `${actor} restored ${restoredEntry.issueCode} to the active library.`,
        ["isArchived", "archivedAt"]
      )
    );

    await restoredEntry.save();
    res.json({
      message: "Helpdesk entry restored successfully.",
      entry: restoredEntry,
    });
  } catch (error) {
    sendError(res, error, "Unable to restore the helpdesk entry.");
  }
};
