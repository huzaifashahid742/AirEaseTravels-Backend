import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { ROLES, STAFF_ROLES } from "../constants/roles.js";

const userProfileSchema = new mongoose.Schema(
    {
        firstName: { type: String, trim: true, default: "" },
        lastName: { type: String, trim: true, default: "" },
        occupation: { type: String, trim: true, default: "" },
        currentEducation: { type: String, trim: true, default: "" },
        phone: { type: String, trim: true, default: "" },
        dateOfBirth: { type: Date },
        currentAge: { type: String, trim: true, default: "" },
        gender: { type: String, enum: ["Male", "Female", "Other", ""], default: "" },
        nationality: { type: String, trim: true, default: "" },
        countryOfResidence: { type: String, trim: true, default: "" },
        currentAddress: { type: String, trim: true, default: "" },
        passportNumber: { type: String, trim: true, uppercase: true, default: "" },
        profilePhoto: { type: String, default: "" },
        skills: { type: [String], default: [] },
    },
    { _id: false }
);

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Name is required"],
            trim: true,
        },
        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            lowercase: true,
            trim: true,
            match: [
                /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                "Please provide a valid email address",
            ],
        },
        password: {
            type: String,
            minlength: [6, "Password must be at least 6 characters long"],
        },
        // 🔴 Add these two fields for Google OAuth
        googleId: { type: String, unique: true, sparse: true },
        isProfileComplete: {
            type: Boolean,
            default: function() {
                // True if they signed up with a password, false if they came via Google
                return !!this.password;
            }
        },
        role: {
            type: String,
            enum: [ROLES.USER, ...STAFF_ROLES],
            default: ROLES.USER,
        },
        profile: {
            type: userProfileSchema,
            default: () => ({}),
        },
    },
    {
        timestamps: true,
        collection: 'users'
    }
);

userSchema.pre("save", async function () {
    if (!this.isModified("password")) return;

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.comparePassword = async function (enteredPassword) {
    try {
        return await bcrypt.compare(enteredPassword, this.password);
    } catch {
        return false;
    }
};

const User = mongoose.model("User", userSchema);
export default User;