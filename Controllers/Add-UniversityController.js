import University from "../Modals/Add-UniversityModal.js";
import Program from "../Modals/Add-ProgramModal.js";
import VisaApplication from "../Modals/ApplyViaUsModal.js";
import { containsRegex, exactRegex } from "../utils/searchHelpers.js";

const MAX_LOGO_LENGTH = 3_000_000;

const normalizeLogo = (logo) => {
    if (!logo || logo === "default-logo.png") return "";
    if (typeof logo === "string" && logo.length > MAX_LOGO_LENGTH) {
        throw new Error("Logo image is too large. Please use a smaller file.");
    }
    return logo;
};

export const createUniversity = async (req, res) => {
    try {
        const { universityName, country, city, programCount, universityType, logo, status, link } = req.body;
        
        if (!universityName || !country || !city || programCount === undefined || !universityType || !link) {
            return res.status(400).json({ message: "Please provide all required fields" });
        }
        
        const universityExists = await University.findOne({ universityName });
        if (universityExists) {
            return res.status(400).json({ message: "A university with this name already exists" });
        }
        
        const university = await University.create({
            universityName,
            country,
            city,
            programCount,
            universityType,
            logo: normalizeLogo(logo),
            status,
            link,
            createdBy: req.user._id,
        });

        res.status(201).json({
            success: true,
            message: "University added successfully",
            data: university
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || "Server Error"
        });
    }
};

export const getUniversityById = async (req, res) => {
    try {
        const university = await University.findById(req.params.id);
        if (!university) {
            return res.status(404).json({ success: false, message: "University not found" });
        }
        res.status(200).json({ success: true, data: university });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message || "Server Error" });
    }
};

export const getUniversities = async (req, res) => {
    try {
        const { search = "", country, city, status, page = 1, limit = 20 } = req.query;

        const query = {};
        const term = String(search || "").trim();
        if (term) {
            query.$or = [
                { universityName: containsRegex(term) },
                { country: containsRegex(term) },
                { city: containsRegex(term) },
                { universityType: containsRegex(term) },
                { status: containsRegex(term) },
                { slug: containsRegex(term) },
            ];
        }
        if (country) query.country = containsRegex(country);
        if (city) query.city = containsRegex(city);
        if (status) query.status = exactRegex(status);

        const pageNum = Math.max(1, Number(page));
        const pageSize = Math.max(1, Math.min(100, Number(limit)));

        const [items, total] = await Promise.all([
            University.find(query)
                .sort({ createdAt: -1 })
                .skip((pageNum - 1) * pageSize)
                .limit(pageSize),
            University.countDocuments(query),
        ]);

        res.status(200).json({
            success: true,
            data: items,
            pagination: {
                page: pageNum,
                limit: pageSize,
                total,
                totalPages: Math.ceil(total / pageSize),
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || "Server Error",
        });
    }
};

export const deleteUniversity = async (req, res) => {
    try {
        const university = await University.findById(req.params.id);
        if (!university) {
            return res.status(404).json({ success: false, message: "University not found" });
        }

        const programs = await Program.find({ universityId: university._id }).select("_id");
        const programIds = programs.map((p) => p._id);

        if (programIds.length) {
            await VisaApplication.deleteMany({ programId: { $in: programIds } });
        }
        const { deletedCount: programsDeleted } = await Program.deleteMany({ universityId: university._id });
        await university.deleteOne();

        res.status(200).json({
            success: true,
            message: `University deleted along with ${programsDeleted} linked program(s)`,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message || "Server Error" });
    }
};

export const updateUniversity = async (req, res) => {
    try {
        const { id } = req.params;
        const { universityName, country, city, programCount, universityType, logo, status, link } = req.body;

        // 1. Find the university first to verify existence
        let university = await University.findById(id);
        if (!university) {
            return res.status(404).json({ success: false, message: "University not found" });
        }

        // 2. If the name is changing, check for duplicates and manually generate a new slug
        let updatedFields = {
            country,
            city,
            programCount,
            universityType,
            status,
            link,
        };

        if (logo !== undefined) {
            updatedFields.logo = normalizeLogo(logo);
        }

        if (universityName && universityName !== university.universityName) {
            const nameExists = await University.findOne({ universityName });
            if (nameExists) {
                return res.status(400).json({ success: false, message: "A university with this name already exists" });
            }
            
            updatedFields.universityName = universityName;
            // Regenerate slug since pre-save hooks don't run on findByIdAndUpdate
            updatedFields.slug = universityName
                .toLowerCase()
                .replace(/[^a-z0-9 ]/g, "")
                .replace(/\s+/g, "-");
        }

        // 3. Update the document in the database
        university = await University.findByIdAndUpdate(
            id,
            { $set: updatedFields },
            { new: true, runValidators: true } // 'new: true' returns the modified document instead of the old one
        );

        res.status(200).json({
            success: true,
            message: "University updated successfully",
            data: university
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || "Server Error"
        });
    }
};