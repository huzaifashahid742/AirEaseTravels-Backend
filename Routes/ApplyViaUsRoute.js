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
import multer from "multer";
import path from "path";
import fs from "fs";

const Applyrouter = express.Router();

// 1. Ensure the 'uploads' directory exists safely on startup
const uploadDir = './uploads';
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir, { recursive: true });
}

// 2. Configure disk storage engine for Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir); 
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ storage });

// Accept all uploaded file fields (transcript, IELTS, school results, etc.)
const uploadFields = upload.any();

// 4. NEW MIDDLEWARE: Fixes empty req.body when using FormData objects
const parseFormDataBody = (req, res, next) => {
    if (!req.body) return next();
    
    // List fields that might arrive as JSON strings from frontend FormData
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

// --- ROUTES (Now tracking parseFormDataBody middleware) ---

Applyrouter.post("/draft", protect, uploadFields, parseFormDataBody, saveApplicationDraft);
Applyrouter.post("/:id/submit", protect, uploadFields, parseFormDataBody, submitDraftApplication);
Applyrouter.post("/", protect, uploadFields, parseFormDataBody, submitVisaApplication);

// Standard text/parameter endpoints
Applyrouter.get("/draft/program/:programId", protect, getDraftByProgram);
Applyrouter.get("/admin/all", protect, authorizePermission("applications"), getAllVisaApplications);
Applyrouter.get("/mine", protect, getMyVisaApplications);
Applyrouter.get("/:id", protect, getVisaApplicationById);
Applyrouter.put("/:id", protect, uploadFields, parseFormDataBody, updateVisaApplication); 
Applyrouter.delete("/:id", protect, deleteVisaApplication);

export default Applyrouter;