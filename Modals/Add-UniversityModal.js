import mongoose from "mongoose";

const universitySchema = new mongoose.Schema(
    {
        universityName: {
            type: String,
            required: [true, "University name is required"],
            unique: true,
            trim: true,
        },
        slug: {
            type: String,
            lowercase: true,
            unique: true, // Optimizes B-tree index lookups for lightning-fast frontend URL route scanning
        },
        country: {
            type: String,
            required: [true, "Country is required"],
            trim: true,
        },
        city: {
            type: String,
            required: [true, "City is required"],
            trim: true, 
        },
        programCount: {
            type: Number,
            required: [true, "Program count is required"],
            min: [0, "Program count cannot be negative"],
            default: 0,
        },
        universityType: {
            type: String,
            required: [true, "University type is required"],
            enum: {
                values: ["Public", "Private", "Semi-Government"],
                message: "{VALUE} is not a valid university type",
            },
        },
        logo: {
            type: String,
            default: "",
            // Stores base64 data URL (data:image/...) or external URL — served to frontend as-is
        },
        status: {
            type: String,
            required: [true, "Admission status is required"],
            enum: {
                values: ["Open", "Closed", "On Hold"],
                message: "{VALUE} is not a valid status",
            },
            default: "Open",
        },
        link: {
            type: String,
            required: [true, "University page link is required"],
            trim: true,
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

// Auto-generate university slug before save (Mongoose 9+ — no next callback)
universitySchema.pre("save", function () {
    if (this.isModified("universityName") || !this.slug) {
        this.slug = this.universityName
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "");
    }
});

const University = mongoose.model("University", universitySchema);

export default University;