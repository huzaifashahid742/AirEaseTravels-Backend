import User from "../Modals/UserSign.js";
import mongoose from "mongoose";
import {
    ROLES,
    ROLE_LABELS,
    ASSIGNABLE_STAFF_ROLES,
    PERMISSIONS,
    PERMISSION_LABELS,
    canAssignRole,
    canManageUser,
    getAssignableRolesFor,
    getInviteableRolesFor,
    isStaffRole,
    isStudentRole,
} from "../constants/roles.js";
import VisaApplication from "../Modals/ApplyViaUsModal.js";
import jwt from "jsonwebtoken";
import { uploadToCloudinary } from "../utils/cloudinaryUpload.js"; // Import Cloudinary helper

const generateToken = (id) =>
    jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });

const splitName = (fullName) => {
    const parts = String(fullName || "").trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return { firstName: "", lastName: "" };
    if (parts.length === 1) return { firstName: parts[0], lastName: "" };
    if (parts.length === 2) return { firstName: parts[0], lastName: parts[1] };
    return {
        firstName: parts[0],
        lastName: parts[parts.length - 1],
    };
};

const formatUserResponse = (user) => ({
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role || ROLES.USER,
    isProfileComplete: user.isProfileComplete || false,
    profile: user.profile || {},
});

export const signupUser = async (req, res) => {
    try {
        const { 
            name, 
            email, 
            password, 
            firstName, 
            lastName, 
            occupation, 
            currentEducation, 
            phone, 
            dateOfBirth, 
            currentAge, 
            gender, 
            nationality, 
            countryOfResidence, 
            passportNumber, 
            currentAddress 
        } = req.body;

        const normalizedEmail = String(email || "").toLowerCase().trim();

        if (!name || !normalizedEmail || !password) {
            return res.status(400).json({ success: false, message: "Please enter all required data fields" });
        }

        if (await User.findOne({ email: normalizedEmail })) {
            return res.status(400).json({ success: false, message: "A user with this email already exists" });
        }
        
        // Upload profile photo buffer to Cloudinary if file exists
        let profilePhotoUrl = "";
        if (req.file) {
            const cloudinaryResult = await uploadToCloudinary(req.file.buffer, "user-profiles");
            profilePhotoUrl = cloudinaryResult.secure_url;
        }

        const user = await User.create({
            name: name.trim(),
            email: normalizedEmail,
            password,
            role: ROLES.USER,
            profile: {
                ...splitName(name),
                firstName: firstName?.trim() || "",
                lastName: lastName?.trim() || "",
                occupation: occupation?.trim() || "",
                currentEducation: currentEducation?.trim() || "",
                phone: phone?.trim() || "",
                dateOfBirth: dateOfBirth || null,
                currentAge: currentAge ? String(currentAge) : "",
                gender: gender || "",
                nationality: nationality?.trim() || "",
                countryOfResidence: countryOfResidence?.trim() || "",
                passportNumber: passportNumber?.trim().toUpperCase() || "",
                currentAddress: currentAddress?.trim() || "",
                profilePhoto: profilePhotoUrl,
            },
        });

        res.status(201).json({
            success: true,
            message: "Account created successfully.",
            token: generateToken(user._id),
            data: formatUserResponse(user),
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message || "Server Error" });
    }
};

export const signinUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const normalizedEmail = String(email || "").toLowerCase().trim();

        if (!normalizedEmail || !password) {
            return res.status(400).json({ success: false, message: "Please provide email and password" });
        }

        const user = await User.findOne({ email: normalizedEmail });
        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ success: false, message: "Invalid email or password" });
        }

        res.status(200).json({
            success: true,
            message: "Signed in successfully",
            token: generateToken(user._id),
            data: formatUserResponse(user),
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message || "Server Error" });
    }
};

export const getCurrentUser = async (req, res) => {
    return res.status(200).json({ success: true, data: formatUserResponse(req.user) });
};

export const updateUserProfile = async (req, res) => {
    try {
        const profileFieldKeys = [
            "firstName", "lastName", "middleName", "occupation", "currentEducation",
            "phone", "whatsapp", "dateOfBirth", "currentAge", "gender", "nationality",
            "countryOfResidence", "permanentAddress", "currentAddress", "passportNumber",
        ];

        const existingProfile = req.user.profile?.toObject?.() || req.user.profile || {};
        const profileUpdates = { ...existingProfile };

        profileFieldKeys.forEach((key) => {
            if (req.body[key] !== undefined) {
                profileUpdates[key] = req.body[key];
            }
        });

        if (req.body.skills !== undefined) {
            const rawSkills = req.body.skills;
            if (Array.isArray(rawSkills)) {
                profileUpdates.skills = rawSkills.map((s) => String(s).trim()).filter(Boolean);
            } else if (typeof rawSkills === "string") {
                profileUpdates.skills = rawSkills.split(",").map((s) => s.trim()).filter(Boolean);
            }
        }

        if (req.file) {
            const cloudinaryResult = await uploadToCloudinary(req.file.buffer, "user-profiles");
            profileUpdates.profilePhoto = cloudinaryResult.secure_url;
        }

        const updates = { 
            profile: profileUpdates,
            isProfileComplete: true
         };

        if (req.body.name?.trim()) {
            updates.name = req.body.name.trim();
        } else if (profileUpdates.firstName !== undefined || profileUpdates.lastName !== undefined) {
            const fName = profileUpdates.firstName ?? existingProfile.firstName ?? "";
            const lName = profileUpdates.lastName ?? existingProfile.lastName ?? "";
            const mName = profileUpdates.middleName ?? existingProfile.middleName ?? "";
            updates.name = [fName, mName, lName].filter(Boolean).join(" ").trim() || req.user.name;
        }

        const user = await User.findByIdAndUpdate(
            req.user._id,
            { $set: updates },
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            message: "Profile updated",
            data: formatUserResponse(user),
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message || "Server Error" });
    }
};
export const completeProfile = async (req, res) => {
    try {
        const profileFieldKeys = [
            "firstName", "lastName", "middleName", "occupation", "currentEducation",
            "phone", "whatsapp", "dateOfBirth", "currentAge", "gender", "nationality",
            "countryOfResidence", "permanentAddress", "currentAddress", "passportNumber",
        ];

        const existingProfile = req.user.profile?.toObject?.() || req.user.profile || {};
        const profileUpdates = { ...existingProfile };

        profileFieldKeys.forEach((key) => {
            if (req.body[key] !== undefined && req.body[key] !== "") {
                profileUpdates[key] = req.body[key];
            }
        });

        if (req.body.skills !== undefined) {
            const rawSkills = req.body.skills;
            if (Array.isArray(rawSkills)) {
                profileUpdates.skills = rawSkills.map((s) => String(s).trim()).filter(Boolean);
            } else if (typeof rawSkills === "string") {
                profileUpdates.skills = rawSkills.split(",").map((s) => s.trim()).filter(Boolean);
            }
        }

        if (req.file) {
            const cloudinaryResult = await uploadToCloudinary(req.file.buffer, "user-profiles");
            profileUpdates.profilePhoto = cloudinaryResult.secure_url;
        }

        const updates = { 
            profile: profileUpdates,
            isProfileComplete: true // 🔴 Mark onboarding as successfully finished
        };

        if (req.body.name?.trim()) {
            updates.name = req.body.name.trim();
        }

        const user = await User.findByIdAndUpdate(
            req.user._id,
            { $set: updates },
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            message: "Profile completed successfully",
            data: formatUserResponse(user),
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message || "Server Error" });
    }
};

export const listUsersForTeam = async (req, res) => {
    try {
        const users = await User.find()
            .select("name email role createdAt")
            .sort({ createdAt: -1 })
            .lean();

        const formatMember = (u) => ({
            id: u._id,
            name: u.name,
            email: u.email,
            role: u.role,
            roleLabel: ROLE_LABELS[u.role] || u.role,
            createdAt: u.createdAt,
            isStaff: isStaffRole(u.role),
        });

        const staff = users.filter((u) => isStaffRole(u.role)).map(formatMember);
        const students = users.filter((u) => isStudentRole(u.role)).map(formatMember);

        res.status(200).json({
            success: true,
            data: {
                staff,
                students,
                all: users.map(formatMember),
            },
            assignableRoles: getAssignableRolesFor(req.user.role),
            inviteableRoles: getInviteableRolesFor(req.user.role),
            permissions: PERMISSIONS,
            permissionLabels: PERMISSION_LABELS,
            roleLabels: ROLE_LABELS,
            actorRole: req.user.role,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message || "Server Error" });
    }
};

export const updateUserRole = async (req, res) => {
    try {
        const { role } = req.body;
        if (!role) return res.status(400).json({ success: false, message: "Role is required" });

        const target = await User.findById(req.params.id);
        if (!target) return res.status(404).json({ success: false, message: "User not found" });

        if (!canManageUser(req.user.role, target.role)) {
            return res.status(403).json({ success: false, message: "You cannot modify this account." });
        }
        if (!canAssignRole(req.user.role, role)) {
            return res.status(403).json({ success: false, message: "You cannot assign this role." });
        }
        if (String(target._id) === String(req.user._id) && role === ROLES.USER) {
            return res.status(400).json({ success: false, message: "You cannot remove your own staff access." });
        }
        if (target.role === ROLES.SUPER_ADMIN && role !== ROLES.SUPER_ADMIN) {
            if ((await User.countDocuments({ role: ROLES.SUPER_ADMIN })) <= 1) {
                return res.status(400).json({ success: false, message: "At least one Super Admin must remain." });
            }
        }

        target.role = role;
        await target.save();

        res.status(200).json({
            success: true,
            message: `Role updated to ${ROLE_LABELS[role] || role}`,
            data: formatUserResponse(target),
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message || "Server Error" });
    }
};

export const removeStaffMember = async (req, res) => {
    try {
        const target = await User.findById(req.params.id);
        if (!target) return res.status(404).json({ success: false, message: "User not found" });

        if (!isStaffRole(target.role)) {
            return res.status(400).json({ success: false, message: "This account is not a staff member." });
        }
        if (target.role === ROLES.SUPER_ADMIN) {
            return res.status(403).json({ success: false, message: "Super Admin accounts cannot be removed." });
        }
        if (!canManageUser(req.user.role, target.role)) {
            return res.status(403).json({ success: false, message: "You cannot remove this staff member." });
        }
        if (String(target._id) === String(req.user._id)) {
            return res.status(400).json({ success: false, message: "You cannot remove your own account." });
        }

        target.role = ROLES.USER;
        await target.save();

        res.status(200).json({
            success: true,
            message: `${target.name} no longer has staff access.`,
            data: formatUserResponse(target),
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message || "Server Error" });
    }
};

export const getAllStudents = async (req, res) => {
    try {
        const students = await User.find({ 
            role: { $regex: /^user$/i } 
        })
        .select("-password")
        .sort({ createdAt: -1 })
        .lean();

        const formattedStudents = students.map(student => ({
            id: student._id,
            name: student.name,
            email: student.email,
            role: student.role,
            countryOfResidence: student.profile?.countryOfResidence || student.countryOfResidence || "",
            profile: student.profile || {}
        }));

        return res.status(200).json({
            success: true,
            count: formattedStudents.length,
            data: formattedStudents
        });
    } catch (error) {
        return res.status(500).json({ 
            success: false, 
            message: error.message || "Failed to fetch students" 
        });
    }
};

export const getStudentById = async (req, res) => {
    try {
        const student = await User.findOne({ 
            _id: req.params.id, 
            role: { $regex: /^user$/i } 
        }).select("-password");
        
        if (!student) {
            return res.status(404).json({ success: false, message: "Student not found" });
        }
        res.status(200).json({ success: true, data: formatUserResponse(student) });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || "Failed to fetch student" });
    }
};

export const deleteStudent = async (req, res) => {
    try {
        const student = await User.findOne({ _id: req.params.id, role: ROLES.USER });
        if (!student) {
            return res.status(404).json({ success: false, message: "Student not found" });
        }
        const { deletedCount: applicationsDeleted } = await VisaApplication.deleteMany({ userId: student._id });
        await student.deleteOne();
        res.status(200).json({
            success: true,
            message: `Student deleted${applicationsDeleted ? ` along with ${applicationsDeleted} application(s)` : ""}`,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message || "Failed to delete student" });
    }
};

export const inviteStaffMember = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        const normalizedEmail = String(email || "").toLowerCase().trim();
        if (!name || !normalizedEmail || !password || !role) {
            return res.status(400).json({ success: false, message: "Name, email, password, and role are required" });
        }
        if (!canAssignRole(req.user.role, role) || role === ROLES.USER) {
            return res.status(403).json({ success: false, message: "Invalid staff role for invitation." });
        }
        if (await User.findOne({ email: normalizedEmail })) {
            return res.status(400).json({ success: false, message: "Email already registered" });
        }
        const user = await User.create({
            name: name.trim(),
            email: normalizedEmail,
            password,
            role,
        });
        res.status(201).json({
            success: true,
            message: `${ROLE_LABELS[role]} account created`,
            data: formatUserResponse(user),
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message || "Server Error" });
    }
};