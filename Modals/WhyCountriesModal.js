import mongoose from "mongoose";

const countryDetailSchema = new mongoose.Schema(
    {
        countryName: {
            type: String,
            required: [true, "Country name is required"],
            unique: true,
            trim: true,
        },
        slug: {
            type: String,
            lowercase: true,
            unique: true,
        },
        flagImage: {
            type: String,
            required: [true, "Flag image URL or path is required"],
            default: "default-flag.png",
        },
        tuitionFees: {
            type: Number, 
            required: [true, "Tuition fees amount is required"],
            min: [0, "Tuition fees cannot be negative"],
        },
        costOfLiving: {
            type: Number, 
            required: [true, "Cost of living amount is required"],
            min: [0, "Cost of living cannot be negative"],
        },
        scholarshipAvailable: {
            type: String,
            required: [true, "Scholarship status selection is required"],
            enum: {
                values: ["Fully Funded", "Partial Scholarship", "Not Available"],
                message: "{VALUE} is not a valid option. Choose: Fully Funded, Partial Scholarship, or Not Available",
            },
        },
        workRight: {
            type: String,
            required: [true, "Work rights detailed description is required"],
            trim: true, 
        },
        visaDifficulty: {
            type: String,
            required: [true, "Visa difficulty level is required"],
            enum: {
                values: ["Easy", "Medium", "Hard"],
                message: "{VALUE} is not a valid difficulty level",
            },
        },
        intakeSeasons: {
            type: [String], 
            default: undefined,
            required: [true, "At least one intake season must be selected"],
            validate: {
                validator: function (v) {
                    return Array.isArray(v) && v.length > 0 && v.every(val => ["Fall", "Spring", "Summer", "Winter"].includes(val));
                },
                message: "Intake seasons must contain at least one selection.",
            },
        },
        prSettlement: {
            type: String,
            required: [true, "PR / Permanent Settlement outlook text is required"],
            trim: true, 
        },
        studentSalary: {
            type: String,
            required: [true, "Average part-time student salary is required"],
            trim: true, 
        },
        rating: {
            type: Number,
            required: [true, "Overall dynamic rating score is required"],
            min: [1, "Rating cannot be lower than 1.0"],
            max: [5, "Rating cannot exceed 5.0"],
        },
        acceptanceRate: {
            type: String,
            required: [true, "Average acceptance rate percentage text is required"],
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
countryDetailSchema.pre("save", function (next) {
    if (this.isModified("countryName") || !this.slug) {
        this.slug = this.countryName
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "");
    }
    next();
});

const CountryDetail = mongoose.model("CountryDetail", countryDetailSchema);
export default CountryDetail;