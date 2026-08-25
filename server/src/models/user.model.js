import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

import { USER_ROLES } from '../constants/roles.js';
import { ACCOUNT_STATUS } from '../constants/accountStatus.js';

const userSchema = new mongoose.Schema({
    // ======================
    // Identity
    // ======================
    name: {
        type: String,
        required: [true, "Name is required"],
        trim: true,
        minlength: [2, "Name must be at least 2 characters"],
        maxlength: [50, "Name cannot exceed 50 characters"],
    },
    email: {
        type: String,
        required: [true, "Email is required"],
        unique: true,
        lowercase: true,
        trim: true,
        match: [
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            "Please enter a valid email address"
        ]
    },
    // ======================
    // Authentication
    // ======================
    password: {
        type: String,
        required: [true, "Password is required"],
        minlength: [8, "Password must be at least 8 characters"],
        select: false
    },

    // ======================
    // Account
    // ======================

    avatar: {
        type: String,
        default: null
    },
    status: {
        type: String,
        enum: Object.values(ACCOUNT_STATUS),
        default: ACCOUNT_STATUS.ACTIVE
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    verificationTokenHash: {
        type: String,
        default: null
    },
    verificationTokenExpiry: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

// ======================
// Middleware (Hooks)
// ======================

userSchema.pre("save", async function () {
    if (!this.isModified("password")) {
        return;
    }
    const saltRounds = 10;
    this.password = await bcrypt.hash(this.password, saltRounds);
});

// ======================
// Instance Methods
// ======================

userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model("User", userSchema);
export default User;