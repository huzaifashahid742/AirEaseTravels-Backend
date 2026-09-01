import mongoose from "mongoose";

const programSchema = new mongoose.Schema(
    {
        programName: {
            type: String,
            required: [true, "Program name is required"],
            trim: true,
        },
        slug: {
            type: String,
            lowercase: true,
            unique: true, 
        },
        universityId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "University",
            required: [true, "A program must be explicitly mapped to a university"],
        },
        tuitionFee: {
            type: Number,
            required: [true, "Tuition fee is required"],
            min: [0, "Tuition fee cannot be negative"],
        },
        duration: {
            type: String,
            required: [true, "Duration is required"],
            trim: true,
        },
        degree: {
            type: String,
            required: [true, "Degree type is required"],
            enum: {
                values: ["Bachelor", "Master", "PhD", "Associate Degree", "Diploma"],
                message: "{VALUE} is not a valid degree classification",
            },
        },
        field: {
            type: String,
            required: [true, "Field of study is required"],
            enum: {
                values: [
                    "Computer Science & Engineering",
                    "Data Science & AI",
                    "Mechanical Engineering",
                    "Business & Management",
                    "Medicine & Healthcare",
                    "Arts & Humanities",
                ],
                message: "{VALUE} is not a supported field",
            },
        },
        language: {
            type: String,
            required: [true, "Language of instruction is required"],
            enum: {
                values: ["English", "Italian", "German", "French", "Spanish"],
                message: "{VALUE} is not a supported language",
            },
            default: "English",
        },
        ieltsRequirement: {
            type: String,
            required: [true, "IELTS score requirement is required"],
            enum: {
                values: ["No Exam Required", "5.5", "6.0", "6.5", "7.0", "7.5+"],
                message: "{VALUE} is not a valid score option",
            },
        },
        status: {
            type: String,
            required: [true, "Program status is required"],
            enum: {
                values: ["Active", "Inactive", "Suspended"],
                message: "{VALUE} is not a valid status option",
            },
            default: "Active",
        },
        applicationDeadline: {
    type: Date,
    required: [true, "Application deadline date is required"],
    validate: {
        validator: function (v) {
            if (!v) return false;
            const year = new Date(v).getFullYear().toString();
            return /^\d{4}$/.test(year);
        },
        message: "Application deadline year must be only 4 digits long no more",
    },
},
        intake: {
            type: String,
            enum: ["Fall", "Spring", "Winter", "Summer"],
            required: [true, "Intake term is required"],
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "An entry must be linked to an admin user"],
        },
    },
    {
        timestamps: true,
    }
);

programSchema.pre("save", function () {
    if (this.isModified("programName") || !this.slug) {
        this.slug = this.programName
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "");
    }
});

const Program = mongoose.model("Program", programSchema);
export default Program;