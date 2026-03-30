const mongoose = require("mongoose");

const User = mongoose.model("User");
const {
  createSessionToken,
  hashPassword,
  sessionExpiryDate,
  verifyPassword,
} = require("../utils/authUtils");

function extractBearerToken(req) {
  const authHeader = String(req.headers.authorization || "");

  if (!authHeader.toLowerCase().startsWith("bearer ")) {
    return "";
  }

  return authHeader.slice(7).trim();
}

function sanitiseUser(user) {
  return {
    id: user._id,
    username: user.username,
    displayName: user.displayName,
    role: user.role,
  };
}

function validateRegistration(body) {
  const username = String(body.username || "").trim().toLowerCase();
  const displayName = String(body.displayName || "").trim();
  const password = String(body.password || "");
  const confirmPassword = String(body.confirmPassword || "");
  const errors = [];

  if (!username) {
    errors.push("Username is required.");
  } else if (!/^[a-z0-9_]+$/.test(username)) {
    errors.push("Username can only contain lowercase letters, numbers, and underscores.");
  } else if (username.length < 4 || username.length > 24) {
    errors.push("Username must be between 4 and 24 characters.");
  }

  if (!displayName) {
    errors.push("Display name is required.");
  } else if (displayName.length < 2 || displayName.length > 60) {
    errors.push("Display name must be between 2 and 60 characters.");
  }

  if (!password) {
    errors.push("Password is required.");
  } else {
    if (password.length < 8) {
      errors.push("Password must be at least 8 characters long.");
    }

    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
      errors.push("Password must include uppercase, lowercase, and numeric characters.");
    }
  }

  if (password !== confirmPassword) {
    errors.push("Password confirmation does not match.");
  }

  return {
    username,
    displayName,
    password,
    errors,
  };
}

exports.register = async (req, res) => {
  try {
    const { username, displayName, password, errors } = validateRegistration(req.body);

    if (errors.length) {
      return res.status(400).json({
        message: "Registration validation failed.",
        details: errors,
      });
    }

    const existingUser = await User.findOne({ username });

    if (existingUser) {
      return res.status(409).json({
        message: "That username is already taken.",
      });
    }

    const { salt, passwordHash } = hashPassword(password);
    const sessionToken = createSessionToken();
    const user = await User.create({
      username,
      displayName,
      role: "Staff",
      passwordHash,
      passwordSalt: salt,
      sessionToken,
      sessionExpiresAt: sessionExpiryDate(),
    });

    return res.status(201).json({
      message: "Account created successfully.",
      token: sessionToken,
      user: sanitiseUser(user),
    });
  } catch (error) {
    return res.status(500).json({
      message: "Unable to register that account.",
      error: error.message,
    });
  }
};

exports.login = async (req, res) => {
  try {
    const username = String(req.body.username || "").trim().toLowerCase();
    const password = String(req.body.password || "");

    if (!username || !password) {
      return res.status(400).json({
        message: "Username and password are required.",
      });
    }

    const user = await User.findOne({ username });

    if (!user || !verifyPassword(password, user.passwordSalt, user.passwordHash)) {
      return res.status(401).json({
        message: "Invalid username or password.",
      });
    }

    user.sessionToken = createSessionToken();
    user.sessionExpiresAt = sessionExpiryDate();
    await user.save();

    return res.json({
      message: "Signed in successfully.",
      token: user.sessionToken,
      user: sanitiseUser(user),
    });
  } catch (error) {
    return res.status(500).json({
      message: "Unable to sign in.",
      error: error.message,
    });
  }
};

exports.require_auth = async (req, res, next) => {
  try {
    const token = extractBearerToken(req);

    if (!token) {
      return res.status(401).json({
        message: "Authentication is required.",
      });
    }

    const user = await User.findOne({
      sessionToken: token,
      sessionExpiresAt: { $gt: new Date() },
    });

    if (!user) {
      return res.status(401).json({
        message: "Your session is no longer valid. Please sign in again.",
      });
    }

    req.authUser = user;
    return next();
  } catch (error) {
    return res.status(500).json({
      message: "Unable to verify your session.",
      error: error.message,
    });
  }
};

exports.require_admin = (req, res, next) => {
  if (!req.authUser || req.authUser.role !== "Admin") {
    return res.status(403).json({
      message: "Admin access is required for that action.",
    });
  }

  return next();
};

exports.me = (req, res) => {
  res.json({
    user: sanitiseUser(req.authUser),
  });
};

exports.logout = async (req, res) => {
  try {
    req.authUser.sessionToken = null;
    req.authUser.sessionExpiresAt = null;
    await req.authUser.save();

    return res.json({
      message: "Signed out successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Unable to sign out.",
      error: error.message,
    });
  }
};
