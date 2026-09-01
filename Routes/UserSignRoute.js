import express from "express";
import {
    getCurrentUser,
    signinUser,
    signupUser,
    updateUserProfile,
    completeProfile,
    requestPasswordOtp, // 🔴 Import the new controller
    listUsersForTeam,
    updateUserRole,
    inviteStaffMember,
    removeStaffMember,
    getAllStudents,
    getStudentById,
    deleteStudent,
} from "../Controllers/UserSignController.js";
import { protect, authorizePermission } from "../middleware/authMiddleware.js";
import { authRateLimit } from "../middleware/rateLimitMiddleware.js";
import { uploadProfilePhoto } from "../middleware/uploadMiddleware.js";

const Userrouter = express.Router();

Userrouter.post("/signup", authRateLimit, uploadProfilePhoto, signupUser);
Userrouter.post("/signin", authRateLimit, signinUser);
Userrouter.get("/me", protect, getCurrentUser);

// 🔴 Route for requesting password verification code via email
Userrouter.post("/request-password-otp", protect, requestPasswordOtp);

Userrouter.put("/profile", protect, uploadProfilePhoto, updateUserProfile);
Userrouter.put("/complete-profile", protect, uploadProfilePhoto, completeProfile);

Userrouter.get("/team", protect, authorizePermission("manageTeam"), listUsersForTeam);
Userrouter.patch("/team/:id/role", protect, authorizePermission("manageTeam"), updateUserRole);
Userrouter.delete("/team/:id", protect, authorizePermission("manageTeam"), removeStaffMember);
Userrouter.post("/team/invite", protect, authorizePermission("manageTeam"), inviteStaffMember);

Userrouter.get("/admin/students", protect, authorizePermission("applications"), getAllStudents);
Userrouter.get("/admin/students/:id", protect, authorizePermission("applications"), getStudentById);
Userrouter.delete("/admin/students/:id", protect, authorizePermission("applications"), deleteStudent);

export default Userrouter;