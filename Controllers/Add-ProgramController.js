import Program from "../Modals/Add-ProgramModal.js";
import University from "../Modals/Add-UniversityModal.js";
import { containsRegex, exactRegex } from "../utils/searchHelpers.js";

export const createProgram = async (req, res) => {
    try {
        const {
            programName,
            universityId,
            tuitionFee,
            duration,
            degree,
            field,
            language,
            ieltsRequirement,
            status,
            applicationDeadline,
            intake,
        } = req.body;

        if (!programName || !universityId || tuitionFee === undefined || !duration || !degree || !field || !applicationDeadline || !intake) {
            return res.status(400).json({ success: false, message: "Please enter all required data fields including university" });
        }

        const program = await Program.create({
            programName,
            universityId,
            tuitionFee,
            duration,
            degree,
            field,
            language,
            ieltsRequirement,
            status,
            applicationDeadline,
            intake,
            createdBy: req.user._id,
        });

        res.status(201).json({
            success: true,
            message: "Program added successfully",
            data: program,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message || "Server Error" });
    }
};

export const getProgramById = async (req, res) => {
    try {
        const program = await Program.findById(req.params.id).populate(
            "universityId",
            "universityName country city logo"
        );
        if (!program) {
            return res.status(404).json({ success: false, message: "Program not found" });
        }
        res.status(200).json({ success: true, data: program });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message || "Server Error" });
    }
};

export const getPrograms = async (req, res) => {
    try {
        const {
            search = "",
            degree,
            field,
            language,
            intake,
            status,
            page = 1,
            limit = 20,
        } = req.query;

        const query = {};
        const term = String(search || "").trim();

        if (term) {
            const matchingUniversities = await University.find({
                $or: [
                    { universityName: containsRegex(term) },
                    { city: containsRegex(term) },
                    { country: containsRegex(term) },
                    { universityType: containsRegex(term) },
                    { status: containsRegex(term) },
                ],
            }).select("_id");
            const universityIds = matchingUniversities.map((u) => u._id);

            const searchConditions = [
                { programName: containsRegex(term) },
                { field: containsRegex(term) },
                { degree: containsRegex(term) },
                { language: containsRegex(term) },
                { intake: containsRegex(term) },
                { status: containsRegex(term) },
                { duration: containsRegex(term) },
                { ieltsRequirement: containsRegex(term) },
                { slug: containsRegex(term) },
            ];

            if (universityIds.length > 0) {
                searchConditions.push({ universityId: { $in: universityIds } });
            }

            const tuitionNumber = Number(term.replace(/[^0-9.]/g, ""));
            if (!Number.isNaN(tuitionNumber) && term !== "") {
                searchConditions.push({ tuitionFee: tuitionNumber });
            }

            query.$or = searchConditions;
        }

        if (degree) query.degree = exactRegex(degree);
        if (field) query.field = containsRegex(field);
        if (language) query.language = exactRegex(language);
        if (intake) query.intake = exactRegex(intake);
        if (status) query.status = exactRegex(status);
        if (req.query.universityId) query.universityId = req.query.universityId;

        if (req.query.city) {
            const universitiesInCity = await University.find({
                city: containsRegex(req.query.city),
            }).select("_id");
            const ids = universitiesInCity.map((u) => u._id);
            if (ids.length === 0) {
                query.universityId = { $in: [] };
            } else if (query.universityId) {
                const match = ids.some((id) => String(id) === String(query.universityId));
                query.universityId = match ? query.universityId : { $in: [] };
            } else {
                query.universityId = { $in: ids };
            }
        }

        const pageNum = Math.max(1, Number(page));
        const pageSize = Math.max(1, Math.min(100, Number(limit)));

        const [items, total] = await Promise.all([
            Program.find(query)
                .populate("universityId", "universityName country city logo")
                .sort({ createdAt: -1 })
                .skip((pageNum - 1) * pageSize)
                .limit(pageSize),
            Program.countDocuments(query),
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
export const deleteProgram = async (req, res) => {
    try {
        const program = await Program.findByIdAndDelete(req.params.id);
        if (!program) {
            return res.status(404).json({ success: false, message: "Program not found" });
        }
        res.status(200).json({ success: true, message: "Program deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message || "Server Error" });
    }
};

export const updateProgram = async (req, res) => {
    try {
        const { id } = req.params;
        const dataToUpdate = { ...req.body };

        let program = await Program.findById(id);
        if (!program) {
            return res.status(404).json({ success: false, message: "Program document not found" });
        }

        // Handle slug creation if program name changes during modification
        if (dataToUpdate.programName && dataToUpdate.programName !== program.programName) {
            dataToUpdate.slug = dataToUpdate.programName
                .toLowerCase()
                .replace(/[^a-z0-9 ]/g, "")
                .replace(/\s+/g, "-");
        }

        program = await Program.findByIdAndUpdate(
            id,
            { $set: dataToUpdate },
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            message: "Program updated successfully",
            data: program,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message || "Server Error" });
    }
};