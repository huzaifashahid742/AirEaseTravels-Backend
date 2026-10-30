import VisaApplication from "../Modals/ApplyViaUsModal.js";
import Program from "../Modals/Add-ProgramModal.js";
import { validateApplicationSubmit } from "../utils/applicationValidation.js";
import { hasPermission } from "../constants/roles.js";
import { uploadToCloudinary } from "../utils/cloudinaryUpload.js";

const buildFullName = (personalInfo) => {
    const p = personalInfo || {};
    if (p.fullName?.trim()) return p.fullName.trim();
    return [p.firstName, p.lastName].filter(Boolean).join(" ").trim();
};

const normalizePersonalInfo = (personalInfo) => {
    if (!personalInfo) return {};
    
    const p = typeof personalInfo.toObject === 'function' 
        ? personalInfo.toObject() 
        : { ...personalInfo };

    p.fullName = buildFullName(p);

    const incomingCnic = p.cnic || p.CNIC;
    if (incomingCnic) {
        p.cnic = String(incomingCnic).trim();
    }
    delete p.CNIC; 

    return p;
};

const pickDraftPayload = (body) => {
    const fields = [
        "programId",
        "programName",
        "universityName",
        "currentStep",
        "personalInfo",
        "academicBackground",
        "languageProficiency",
        "programInterest",
        "experienceInfo",
        "financialAndVisa"
    ];
    const payload = {};
    fields.forEach((key) => {
        if (body[key] !== undefined) payload[key] = body[key];
    });

    if (payload.personalInfo) {
        payload.personalInfo = normalizePersonalInfo(payload.personalInfo);
    }
    if (payload.academicBackground && typeof payload.academicBackground === 'object') {
        if (payload.academicBackground.transcriptUpload && typeof payload.academicBackground.transcriptUpload === 'object') {
            payload.academicBackground.transcriptUpload = "";
        }
        if (Array.isArray(payload.academicBackground.schools)) {
            payload.academicBackground.schools = payload.academicBackground.schools.map((school) => {
                const cleaned = { ...school };
                if (cleaned.resultUpload && typeof cleaned.resultUpload === 'object') {
                    cleaned.resultUpload = "";
                }
                if (cleaned.graduationYear !== undefined && cleaned.graduationYear !== "") {
                    cleaned.graduationYear = Number(cleaned.graduationYear);
                }
                return cleaned;
            });
        }
    }

    if (payload.languageProficiency && typeof payload.languageProficiency === 'object') {
        if (payload.languageProficiency.IELTSresult && typeof payload.languageProficiency.IELTSresult === 'object') {
            payload.languageProficiency.IELTSresult = "";
        }
    }

    return payload;
};

const handleFileMapping = async (req, payload) => {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) return payload;

    if (!payload.attachments) payload.attachments = {};
    if (!payload.academicBackground) payload.academicBackground = {};
    if (!payload.languageProficiency) payload.languageProficiency = {};

    for (const file of req.files) {
        const fieldName = file.fieldname.toLowerCase();

        const cloudinaryResult = await uploadToCloudinary(file.buffer, "visa-documents");
        const fileUrl = cloudinaryResult.secure_url;

        if (fieldName.includes('resume')) {
            payload.attachments.resumeCv = fileUrl;
        }
        else if (fieldName.includes('passport')) {
            payload.attachments.passportCopyUpload = fileUrl;
        }
        else if (fieldName.startsWith('schoolresultupload_')) {
            const index = parseInt(fieldName.replace('schoolresultupload_', ''), 10);
            if (!Number.isNaN(index)) {
                if (!Array.isArray(payload.academicBackground.schools)) {
                    payload.academicBackground.schools = [];
                }
                while (payload.academicBackground.schools.length <= index) {
                    payload.academicBackground.schools.push({});
                }
                payload.academicBackground.schools[index] = {
                    ...payload.academicBackground.schools[index],
                    resultUpload: fileUrl,
                };
            }
        }
        else if (fieldName.includes('transcript')) {
            payload.academicBackground.transcriptUpload = fileUrl;
        }
        else if (fieldName.includes('ielts') || fieldName.includes('languageresult')) {
            payload.languageProficiency.IELTSresult = fileUrl;
        }
        else if (fieldName.includes('purpose') || fieldName.includes('sop')) {
            payload.attachments.statementOfPurpose = fileUrl;
        }
        else if (fieldName.includes('nationalid') || fieldName.includes('idproof') || fieldName.includes('proof')) {
            payload.attachments.nationalIdProof = fileUrl;
        }
    }

    return payload;
};

const mergeSchoolRecords = (existing = [], incoming = []) => {
    if (!Array.isArray(incoming)) return existing;
    return incoming.map((school, index) => ({
        ...(existing[index] || {}),
        ...school,
    }));
};

const mergeDraftWithExisting = (existing, payload) => {
    if (!existing) return payload;
    const existingObj = existing.toObject ? existing.toObject() : existing;

    return {
        ...payload,
        personalInfo: {
            ...(existingObj.personalInfo || {}),
            ...(payload.personalInfo || {}),
        },
        experienceInfo: {
            ...(existingObj.experienceInfo || {}),
            ...(payload.experienceInfo || {}),
        },
        financialAndVisa: {
            ...(existingObj.financialAndVisa || {}),
            ...(payload.financialAndVisa || {}),
        },
    };
};

export const saveApplicationDraft = async (req, res) => {
    try {
        const { applicationId, programId } = req.body;
        let payload = pickDraftPayload(req.body);
        payload = await handleFileMapping(req, payload);

        payload.userId = req.user._id;
        payload.isDraft = true;
        payload.applicationStatus = "Draft";

        if (programId && !payload.programName) {
            const program = await Program.findById(programId).populate("universityId", "universityName");
            if (program) {
                payload.programName = program.programName;
                payload.universityName = program.universityId?.universityName || "";
            }
        }

        let existing = null;
        if (applicationId) {
            existing = await VisaApplication.findOne({
                _id: applicationId,
                userId: req.user._id,
            });
            if (!existing) {
                return res.status(404).json({ success: false, message: "Application not found" });
            }
        } else if (programId) {
            existing = await VisaApplication.findOne({
                userId: req.user._id,
                programId,
                isDraft: true,
            });
        }

        if (existing) {
            payload = mergeDraftWithExisting(existing, payload);
        }

        let application;
        if (existing) {
            application = await VisaApplication.findByIdAndUpdate(
                existing._id,
                { $set: payload },
                { new: true, runValidators: false }
            );
        } else {
            const doc = new VisaApplication(payload);
            application = await doc.save({ validateBeforeSave: false });
        }

        res.status(200).json({
            success: true,
            message: "Progress saved. You can continue later.",
            data: application,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message || "Server Error" });
    }
}; 

export const getDraftByProgram = async (req, res) => {
    try {
        const application = await VisaApplication.findOne({
            userId: req.user._id,
            programId: req.params.programId,
            isDraft: true,
        });
        res.status(200).json({ success: true, data: application || null });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message || "Server Error" });
    }
};

export const submitVisaApplication = async (req, res) => {
    try {
        const { id } = req.params;

        const updatedApplication = await VisaApplication.findByIdAndUpdate(
            id,
            { 
                isDraft: false, 
                applicationStatus: "Pending",
                submittedAt: new Date() 
            },
            { new: true, runValidators: false }
        );

        if (!updatedApplication) {
            return res.status(404).json({ success: false, message: "Visa application not found" });
        }

        return res.status(200).json({ success: true, data: updatedApplication });
    } catch (error) {
        console.error("Submission Error:", error);
        return res.status(500).json({ 
            success: false, 
            message: error.message || "Internal Server Error" 
        });
    }
};

export const submitDraftApplication = async (req, res) => {
    try {
        const application = await VisaApplication.findOne({
            _id: req.params.id,
            userId: req.user._id,
        });

        if (!application) {
            return res.status(404).json({ success: false, message: "Application not found" });
        }

        let payload = pickDraftPayload(req.body);
        payload = await handleFileMapping(req, payload);

        // Build request body with placeholders to pass text-only validation checks cleanly
        const body = { 
            ...application.toObject(), 
            ...payload,
            attachments: {
                resumeCv: payload.attachments?.resumeCv || application.attachments?.resumeCv || "N/A",
                passportCopyUpload: payload.attachments?.passportCopyUpload || application.attachments?.passportCopyUpload || "N/A",
                nationalIdProof: payload.attachments?.nationalIdProof || application.attachments?.nationalIdProof || "N/A",
                statementOfPurpose: payload.attachments?.statementOfPurpose || application.attachments?.statementOfPurpose || "N/A",
            },
            academicBackground: {
                ...(application.academicBackground || {}),
                ...(payload.academicBackground || {}),
                transcriptUpload: payload.academicBackground?.transcriptUpload || application.academicBackground?.transcriptUpload || "N/A",
            }
        };

        if (req.body.personalInfo) {
            body.personalInfo = normalizePersonalInfo({ ...application.personalInfo, ...req.body.personalInfo });
        }

        const errors = validateApplicationSubmit(body);
        if (errors.length) {
            return res.status(400).json({ 
                success: false, 
                message: errors.join(". ")
            });
        }

        const finalPayload = pickDraftPayload(body);
        finalPayload.isDraft = false;
        finalPayload.applicationStatus = "Pending";
        finalPayload.submittedAt = new Date();

        const updated = await VisaApplication.findByIdAndUpdate(
            req.params.id,
            { $set: finalPayload },
            { new: true, runValidators: false }
        );

        res.status(200).json({
            success: true,
            message: "Application submitted successfully!",
            data: updated,
        });
    } catch (error) {
        console.error("CRASH STACK TRACE:", error);
        res.status(500).json({ 
            success: false, 
            message: error.message || "Server Error",
            stack: error.stack 
        });
    }
};

export const getAllVisaApplications = async (req, res) => {
    try {
        const applications = await VisaApplication.find({ isDraft: { $ne: true } })
            .sort({ createdAt: -1 })
            .populate("userId", "name email role")
            .populate("programId", "programName");
        res.status(200).json({ success: true, data: applications });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message || "Server Error" });
    }
};

export const getMyVisaApplications = async (req, res) => {
    try {
        const applications = await VisaApplication.find({ userId: req.user._id })
            .sort({ updatedAt: -1 })
            .populate("programId", "programName degree field");
        res.status(200).json({ success: true, data: applications });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message || "Server Error" });
    }
};

export const getVisaApplicationById = async (req, res) => {
    try {
        const application = await VisaApplication.findById(req.params.id).populate(
            "programId",
            "programName degree field tuitionFee duration"
        );
        if (!application) {
            return res.status(404).json({ success: false, message: "Application not found" });
        }

        const isOwner = application.userId.toString() === req.user._id.toString();
        const isAdmin = hasPermission(req.user.role, "applications");
        if (!isOwner && !isAdmin) {
            return res.status(403).json({ success: false, message: "Forbidden. Access denied." });
        }

        res.status(200).json({ success: true, data: application });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message || "Server Error" });
    }
};

export const deleteVisaApplication = async (req, res) => {
    try {
        const application = await VisaApplication.findById(req.params.id);
        if (!application) {
            return res.status(404).json({ success: false, message: "Application not found" });
        }

        const isOwner = application.userId.toString() === req.user._id.toString();
        const isAdmin = hasPermission(req.user.role, "applications");
        if (!isOwner && !isAdmin) {
            return res.status(403).json({ success: false, message: "Forbidden. Access denied." });
        }

        await VisaApplication.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, message: "Application deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message || "Server Error" });
    }
};

export const updateVisaApplication = async (req, res) => {
    try {
        const { id } = req.params;
        let application = await VisaApplication.findById(id);
        if (!application) {
            return res.status(404).json({ success: false, message: "Application not found" });
        }

        const isOwner = application.userId.toString() === req.user._id.toString();
        const isAdmin = hasPermission(req.user.role, "applications");
        if (!isOwner && !isAdmin) {
            return res.status(403).json({ success: false, message: "Forbidden." });
        }

        let payload = pickDraftPayload(req.body);
        payload = await handleFileMapping(req, payload);
        payload = mergeDraftWithExisting(application, payload);

        if (payload.personalInfo) {
            payload.personalInfo = normalizePersonalInfo({
                ...application.personalInfo?.toObject?.() || application.personalInfo,
                ...payload.personalInfo, 
            });
        }

        if (isAdmin && req.body.applicationStatus) {
            payload.applicationStatus = req.body.applicationStatus;
        }

        application = await VisaApplication.findByIdAndUpdate(
            id,
            { $set: payload },
            { new: true, runValidators: false }
        );

        res.status(200).json({
            success: true,
            message: "Application updated successfully",
            data: application,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message || "Server Error" });
    }
};