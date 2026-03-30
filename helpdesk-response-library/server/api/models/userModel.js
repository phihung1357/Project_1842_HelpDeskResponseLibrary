const mongoose = require("mongoose");

const { Schema } = mongoose;

const UserSchema = new Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required."],
      unique: true,
      trim: true,
      lowercase: true,
      minlength: [4, "Username must be at least 4 characters long."],
      maxlength: [24, "Username must be 24 characters or fewer."],
      match: [
        /^[a-z0-9_]+$/,
        "Username can only contain lowercase letters, numbers, and underscores.",
      ],
    },
    displayName: {
      type: String,
      required: [true, "Display name is required."],
      trim: true,
      minlength: [2, "Display name must be at least 2 characters long."],
      maxlength: [60, "Display name must be 60 characters or fewer."],
    },
    role: {
      type: String,
      enum: ["Admin", "Staff"],
      default: "Staff",
    },
    passwordHash: {
      type: String,
      required: true,
    },
    passwordSalt: {
      type: String,
      required: true,
    },
    sessionToken: {
      type: String,
      default: null,
    },
    sessionExpiresAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: "users",
  }
);

module.exports = mongoose.model("User", UserSchema);
