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
import { upload } from "../middleware/uploadMiddleware.js";

const Applyrouter = express.Router();

const uploadFields = upload.any();
const parseFormDataBody = (req, res, next) => {
    if (!req.body) return next();
    
    const complexFields = [
        "personalInfo", 
        "academicBackground", 
        "languageProficiency", 
        "programInterest", 
        "experienceInfo", 
        "financialAndVisa"
    ];

    complexFields.forEach((field) => {
        if (typeof req.body[field] === 'string') {
            try {
                req.body[field] = JSON.parse(req.body[field]);
            } catch (e) {
            }
        }
    });
    next();
};

// --- STATIC & SPECIFIC ROUTES FIRST ---
Applyrouter.get("/mine", protect, getMyVisaApplications);
Applyrouter.get("/admin/all", protect, authorizePermission("applications"), getAllVisaApplications);
Applyrouter.get("/draft/program/:programId", protect, getDraftByProgram);

Applyrouter.post("/draft", protect, uploadFields, parseFormDataBody, saveApplicationDraft);
Applyrouter.post("/", protect, uploadFields, parseFormDataBody, submitVisaApplication);
Applyrouter.post("/:id/submit", protect, uploadFields, parseFormDataBody, submitDraftApplication);


Applyrouter.get("/:id", protect, getVisaApplicationById);
Applyrouter.put("/:id", protect, uploadFields, parseFormDataBody, updateVisaApplication);
Applyrouter.delete("/:id", protect, deleteVisaApplication);

export default Applyrouter;