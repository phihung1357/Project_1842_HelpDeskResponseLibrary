import Vue from "vue";
import axios from "axios";
import VueFlashMessage from "vue-flash-message";
import "vue-flash-message/dist/vue-flash-message.min.css";

Vue.use(VueFlashMessage, {
  messageOptions: {
    timeout: 3000,
    pauseOnInteract: true,
  },
});

const vm = new Vue();
const baseURL =
  process.env.VUE_APP_API_BASE_URL || "http://localhost:3000";
export const priorityOptions = ["Low", "Medium", "High", "Critical"];
export const priorityOrder = {
  Low: 1,
  Medium: 2,
  High: 3,
  Critical: 4,
};
const authStorageKey = "helpdesk-auth-session";

function extractErrorMessage(error, fallbackMessage) {
  const response = error.response && error.response.data;

  if (response && Array.isArray(response.details) && response.details.length) {
    return response.details.join(" ");
  }

  if (response && response.message) {
    return response.message;
  }

  return fallbackMessage;
}

function handleError(error, fallbackMessage) {
  const message = extractErrorMessage(error, fallbackMessage);

  vm.flash(message, "error", {
    timeout: 5000,
  });

  throw error;
}

const http = axios.create({
  baseURL,
});

http.interceptors.request.use((config) => {
  const session = getSession();

  if (session && session.token) {
    config.headers.Authorization = `Bearer ${session.token}`;
  }

  return config;
});

async function writeTextToClipboard(text) {
  if (
    typeof navigator !== "undefined" &&
    navigator.clipboard &&
    typeof window !== "undefined" &&
    window.isSecureContext
  ) {
    await navigator.clipboard.writeText(text);
    return;
  }

  if (typeof document === "undefined") {
    throw new Error("Clipboard API is not available.");
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.top = "-1000px";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  textarea.setSelectionRange(0, textarea.value.length);

  const successful = document.execCommand("copy");
  document.body.removeChild(textarea);

  if (!successful) {
    throw new Error("document.execCommand('copy') failed.");
  }
}

export async function copyTextToClipboard(text, successMessage) {
  const value = String(text || "").trim();

  if (!value) {
    vm.flash("There is nothing to copy yet.", "warning", {
      timeout: 2500,
    });
    return false;
  }

  try {
    await writeTextToClipboard(value);
    vm.flash(successMessage || "Copied to clipboard.", "success", {
      timeout: 2000,
    });
    return true;
  } catch (error) {
    vm.flash("Unable to copy that value to the clipboard.", "error", {
      timeout: 3000,
    });
    return false;
  }
}

function notifyAuthChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("helpdesk-auth-changed"));
  }
}

export function getSession() {
  if (typeof window === "undefined") {
    return null;
  }

  const storedValue = window.localStorage.getItem(authStorageKey);

  if (!storedValue) {
    return null;
  }

  try {
    const parsedValue = JSON.parse(storedValue);

    if (
      !parsedValue ||
      typeof parsedValue !== "object" ||
      !parsedValue.token ||
      !parsedValue.user ||
      !parsedValue.user.role
    ) {
      window.localStorage.removeItem(authStorageKey);
      return null;
    }

    return parsedValue;
  } catch (error) {
    window.localStorage.removeItem(authStorageKey);
    return null;
  }
}

export function isAuthenticated() {
  return !!getSession();
}

export function isAdmin() {
  const session = getSession();
  return !!session && session.user && session.user.role === "Admin";
}

function saveSession(token, user) {
  const session = {
    token,
    user,
  };
  window.localStorage.setItem(authStorageKey, JSON.stringify(session));
  notifyAuthChanged();
  return session;
}

export async function registerUser(payload) {
  try {
    const response = await http.post("/auth/register", payload);
    const session = saveSession(response.data.token, response.data.user);
    vm.flash("Account created successfully.", "success", {
      timeout: 2500,
    });
    return session;
  } catch (error) {
    handleError(error, "Unable to create that account.");
  }
}

export async function loginUser(username, password) {
  try {
    const response = await http.post("/auth/login", {
      username,
      password,
    });
    const session = saveSession(response.data.token, response.data.user);
    vm.flash(`Signed in as ${session.user.displayName}.`, "success", {
      timeout: 2500,
    });
    return session;
  } catch (error) {
    handleError(error, "Unable to sign in with those credentials.");
  }
}

export async function restoreSession() {
  const session = getSession();

  if (!session || !session.token) {
    return null;
  }

  try {
    const response = await http.get("/auth/me");
    return saveSession(session.token, response.data.user);
  } catch (error) {
    clearSession(false);
    return null;
  }
}

function clearSession(showMessage = true) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(authStorageKey);
  notifyAuthChanged();

  if (showMessage) {
    vm.flash("Signed out successfully.", "info", {
      timeout: 2500,
    });
  }
}

export async function logoutUser() {
  try {
    await http.post("/auth/logout");
  } catch (error) {
    // Ignore logout API failures and clear the local session anyway.
  }

  clearSession(true);
}

export function getCurrentUser() {
  const session = getSession();
  return session ? session.user : null;
}

export function getDisplayName() {
  const user = getCurrentUser();
  return user ? user.displayName : "";
}

export function getUsername() {
  const user = getCurrentUser();
  return user ? user.username : "";
}

export function getRole() {
  const user = getCurrentUser();
  return user ? user.role : "";
}

export function clearStoredSession() {
  clearSession(false);
}

export function flashInfo(message) {
  vm.flash(message, "info", {
    timeout: 2500,
  });
}

function downloadFile(filename, content, mimeType) {
  if (typeof document === "undefined") {
    return false;
  }

  const blob = new Blob([content], { type: mimeType });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
  return true;
}

function escapeCsvValue(value) {
  const text = String(value == null ? "" : value);

  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}

export function exportEntriesAsJson(entries) {
  const content = JSON.stringify(entries, null, 2);
  const filename = `helpdesk-entries-${new Date().toISOString().slice(0, 10)}.json`;
  downloadFile(filename, content, "application/json;charset=utf-8");
  vm.flash("Exported entries as JSON.", "success", {
    timeout: 2500,
  });
}

export function exportEntriesAsCsv(entries) {
  const header = [
    "Issue Code",
    "Department",
    "Priority",
    "Status",
    "Response Text",
    "Tags",
    "Notes",
    "Created At",
    "Updated At",
    "Archived At",
  ];
  const rows = entries.map((entry) => [
    entry.issueCode,
    entry.department,
    entry.priority,
    entry.isArchived ? "Archived" : "Active",
    entry.responseText,
    (entry.tags || []).join("|"),
    entry.notes || "",
    entry.createdAt || "",
    entry.updatedAt || "",
    entry.archivedAt || "",
  ]);
  const csv = [header, ...rows]
    .map((row) => row.map((value) => escapeCsvValue(value)).join(","))
    .join("\n");
  const filename = `helpdesk-entries-${new Date().toISOString().slice(0, 10)}.csv`;
  downloadFile(filename, csv, "text/csv;charset=utf-8");
  vm.flash("Exported entries as CSV.", "success", {
    timeout: 2500,
  });
}

export const api = {
  async getEntries() {
    try {
      const response = await http.get("/entries");
      return response.data;
    } catch (error) {
      handleError(error, "Unable to load helpdesk entries.");
    }
  },

  async getEntry(id) {
    try {
      const response = await http.get(`/entries/${id}`);
      return response.data;
    } catch (error) {
      handleError(error, "Unable to load that helpdesk entry.");
    }
  },

  async createEntry(entry) {
    try {
      const response = await http.post("/entries", entry);
      return response.data;
    } catch (error) {
      handleError(error, "Unable to create the helpdesk entry.");
    }
  },

  async updateEntry(id, entry) {
    try {
      const response = await http.put(`/entries/${id}`, entry);
      return response.data;
    } catch (error) {
      handleError(error, "Unable to update the helpdesk entry.");
    }
  },

  async archiveEntry(id) {
    try {
      const response = await http.delete(`/entries/${id}`);
      return response.data;
    } catch (error) {
      handleError(error, "Unable to archive the helpdesk entry.");
    }
  },

  async restoreEntry(id) {
    try {
      const response = await http.put(`/entries/${id}/restore`);
      return response.data;
    } catch (error) {
      handleError(error, "Unable to restore the helpdesk entry.");
    }
  },

  async deleteEntry(id) {
    try {
      const response = await http.delete(`/entries/${id}`);
      return response.data;
    } catch (error) {
      handleError(error, "Unable to archive the helpdesk entry.");
    }
  },
};
