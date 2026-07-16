import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters long"]
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true
    },

    passwordHash: {
      type: String,
      required: [true, "Password hash is required"]
    },

    role: {
      type: String,
      enum: ["user", "reviewer", "admin"],
      default: "user",
      index: true 
    },

    isActive: {
      type: Boolean,
      default: true
    },

    loginOtpHash: {
      type: String,
      default: null
    },

    loginOtpExpiresAt: {
      type: Date,
      default: null
    },

    lastLoginAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

const User = mongoose.model("User", userSchema);

export default User;