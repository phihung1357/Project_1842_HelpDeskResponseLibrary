const crypto = require("crypto");

const SESSION_DURATION_MS = 1000 * 60 * 60 * 12;

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const passwordHash = crypto
    .pbkdf2Sync(String(password || ""), salt, 100000, 64, "sha512")
    .toString("hex");

  return {
    salt,
    passwordHash,
  };
}

function verifyPassword(password, salt, expectedHash) {
  const { passwordHash } = hashPassword(password, salt);
  return crypto.timingSafeEqual(
    Buffer.from(passwordHash, "hex"),
    Buffer.from(String(expectedHash || ""), "hex")
  );
}

function createSessionToken() {
  return crypto.randomBytes(32).toString("hex");
}

function sessionExpiryDate() {
  return new Date(Date.now() + SESSION_DURATION_MS);
}

module.exports = {
  createSessionToken,
  hashPassword,
  sessionExpiryDate,
  verifyPassword,
};
