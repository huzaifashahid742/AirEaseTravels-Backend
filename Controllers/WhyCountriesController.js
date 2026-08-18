import CountryDetail from "../Modals/WhyCountriesModal.js";
import { uploadToCloudinary } from "../utils/cloudinaryUpload.js";

export const createCountryDetail = async (req, res) => {
    try {
        // Safely fallback to an empty object if req.body is undefined
        const body = req.body || {};

        const {
            countryName,
            tuitionFees,
            costOfLiving,
            scholarshipAvailable,
            workRight,
            visaDifficulty,
            intakeSeasons,
            prSettlement,
            studentSalary,
            rating,
            acceptanceRate,
        } = body;
        
        let flagImagePath = "default-flag.png";
        if (req.file) {
            const cloudinaryResult = await uploadToCloudinary(req.file.buffer, "country-flags");
            flagImagePath = cloudinaryResult.secure_url;
        }

        if (
            !countryName ||
            tuitionFees === undefined ||
            costOfLiving === undefined ||
            !scholarshipAvailable ||
            !visaDifficulty ||
            !intakeSeasons ||
            !studentSalary ||
            !rating ||
            !acceptanceRate
        ) {
            return res.status(400).json({ success: false, message: "Please provide all required fields" });
        }

        const countryExists = await CountryDetail.findOne({ countryName });
        if (countryExists) {
            return res.status(400).json({ success: false, message: "A profile for this country already exists" });
        }

        // Normalize intakeSeasons to guarantee an array format
        let processedSeasons = intakeSeasons;
        if (!Array.isArray(processedSeasons)) {
            processedSeasons = typeof processedSeasons === 'string' 
                ? processedSeasons.split(',').map(s => s.trim()) 
                : [processedSeasons];
        }

        const detailEntry = await CountryDetail.create({
            countryName,
            flagImage: flagImagePath,
            tuitionFees: Number(tuitionFees), 
            costOfLiving: Number(costOfLiving), 
            scholarshipAvailable,
            workRight: workRight || "",
            visaDifficulty,
            intakeSeasons: processedSeasons,
            prSettlement: prSettlement || "",
            studentSalary,
            rating: Number(rating),
            acceptanceRate,
            createdBy: req.user._id,
        });

        res.status(201).json({
            success: true,
            message: "Country details profile added successfully",
            data: detailEntry,
        });
    } catch (error) {
        console.error("CREATE COUNTRY ERROR:", error);
        res.status(500).json({ success: false, message: error.message || "Server Error" });
    }
};

export const getCountryDetails = async (req, res) => {
    try {
        const { search = "", visaDifficulty, scholarshipAvailable, page = 1, limit = 20 } = req.query;
        const query = {};

        const term = String(search || "").trim();
        if (term) {
            const escapedTerm = term.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
            const regexSearch = new RegExp(escapedTerm, 'i');

            const orConditions = [
                { countryName: regexSearch },
                { workRight: regexSearch },
                { visaDifficulty: regexSearch },
                { scholarshipAvailable: regexSearch },
                { prSettlement: regexSearch },
                { studentSalary: regexSearch },
                { acceptanceRate: regexSearch },
                { intakeSeasons: regexSearch }
            ];

            const parsedNumericTerm = Number(term);
            if (!isNaN(parsedNumericTerm) && term !== "") {
                orConditions.push(
                    { tuitionFees: parsedNumericTerm },
                    { costOfLiving: parsedNumericTerm },
                    { rating: parsedNumericTerm }
                );
            }

            query.$or = orConditions;
        }

        if (visaDifficulty) query.visaDifficulty = visaDifficulty;
        if (scholarshipAvailable) query.scholarshipAvailable = scholarshipAvailable;

        const pageNum = Math.max(1, Number(page));
        const pageSize = Math.max(1, Math.min(100, Number(limit)));

        const [items, total] = await Promise.all([
            CountryDetail.find(query)
                .sort({ createdAt: -1 })
                .skip((pageNum - 1) * pageSize)
                .limit(pageSize),
            CountryDetail.countDocuments(query),
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
        res.status(500).json({ success: false, message: error.message || "Server Error" });
    }
};

export const updateCountryDetail = async (req, res) => {
    try {
        // Safely fallback to an empty object if req.body is undefined
        const body = req.body || {};

        const { id } = req.params;
        let countryProfile = await CountryDetail.findById(id);
        
        if (!countryProfile) {
            return res.status(404).json({ success: false, message: "Country destination entry not found" });
        }

        if (req.file) {
            const cloudinaryResult = await uploadToCloudinary(req.file.buffer, "country-flags");
            countryProfile.flagImage = cloudinaryResult.secure_url;
        }

        const fieldsToUpdate = [
            'countryName', 'tuitionFees', 'costOfLiving', 'scholarshipAvailable',
            'workRight', 'visaDifficulty', 'prSettlement', 'studentSalary',
            'rating', 'acceptanceRate'
        ];

        fieldsToUpdate.forEach((key) => {
            if (body[key] !== undefined) {
                if (['tuitionFees', 'costOfLiving', 'rating'].includes(key)) {
                    countryProfile[key] = Number(body[key]);
                } else {
                    countryProfile[key] = body[key];
                }
            }
        });

        if (body.intakeSeasons) {
            countryProfile.intakeSeasons = Array.isArray(body.intakeSeasons) 
                ? body.intakeSeasons 
                : [body.intakeSeasons];
        }

        await countryProfile.save();

        res.status(200).json({
            success: true,
            message: "Country details profile updated successfully",
            data: countryProfile,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message || "Server Error" });
    }
};