import express from "express";
import {
    deleteVisaApplication,
    getAllVisaApplications,
    getDraftByProgram,
    getMyVisaApplications,
    getVisaApplicationById,
    saveApplicationDraft,
    submitDraftApplication,
    submitVisaApplication,
    updateVisaApplication,
} from "../Controllers/ApplyViaUsController.js";
import { authorizePermission, protect } from "../middleware/authMiddleware.js";
import { upload } from "../middleware/uploadMiddleware.js"; // Use your shared memory-storage multer middleware

const Applyrouter = express.Router();

const uploadFields = upload.any();

// Middleware: Fixes empty req.body when using FormData objects
const parseFormDataBody = (req, res, next) => {
    if (!req.body) return next();
    
    const complexFields = [
        "personalInfo", 
        "academicBackground", 
        "languageProficiency", 
        "programInterest", 
        "experienceInfo", 
        "financialAndVisa",
        "attachments"
    ];

    complexFields.forEach((field) => {
        if (typeof req.body[field] === 'string') {
            try {
                req.body[field] = JSON.parse(req.body[field]);
            } catch (e) {
                // If it's not a JSON string, leave it alone
            }
        }
    });
    next();
};

// --- ROUTES ---

Applyrouter.post("/draft", protect, uploadFields, parseFormDataBody, saveApplicationDraft);
Applyrouter.post("/:id/submit", protect, uploadFields, parseFormDataBody, submitDraftApplication);
Applyrouter.post("/", protect, uploadFields, parseFormDataBody, submitVisaApplication);

Applyrouter.get("/draft/program/:programId", protect, getDraftByProgram);
Applyrouter.get("/admin/all", protect, authorizePermission("applications"), getAllVisaApplications);
Applyrouter.get("/mine", protect, getMyVisaApplications);
Applyrouter.get("/:id", protect, getVisaApplicationById);
Applyrouter.put("/:id", protect, uploadFields, parseFormDataBody, updateVisaApplication); 
Applyrouter.delete("/:id", protect, deleteVisaApplication);

export default Applyrouter;