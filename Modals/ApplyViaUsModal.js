import mongoose from "mongoose";

const universityOptionSchema = new mongoose.Schema(
    {
        universityName: { type: String, trim: true },
    },
    { _id: false }
);

const workExperienceSchema = new mongoose.Schema(
    {
        company: { type: String, trim: true },
        role: { type: String, trim: true },
        duration: { type: String, trim: true },
    },
    { _id: false }
);

const schoolSchema = new mongoose.Schema(
    {
        schoolName: { type: String, trim: true, default: "" },
        graduationYear: { type: Number },
        boardOrUniversity: { type: String, trim: true, default: "" },
        gpaOrPercentage: { type: String, trim: true, default: "" },
        resultUpload: { type: String, default: "" },
    },
    { _id: false }
);

const visaApplicationSchema = new mongoose.Schema(
    {
        programId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Program",
        },
        programName: { type: String, trim: true, default: "" },
        universityName: { type: String, trim: true, default: "" },

        currentStep: { type: Number, default: 1, min: 1, max: 8 },
        isDraft: { type: Boolean, default: true },
        submittedAt: { type: Date },

        personalInfo: {
            firstName: { type: String, trim: true, default: "" },
            lastName: { type: String, trim: true, default: "" },
            fullName: { type: String, trim: true, default: "" },
            dateOfBirth: { type: Date },
            gender: { type: String, enum: ["Male", "Female", "Other", ""], default: "" },
            nationality: { type: String, trim: true, default: "" },
            countryOfResidence: { type: String, trim: true, default: "" },
            currentAddress: { type: String, trim: true, default: "" },
            contactNumber: { type: String, trim: true, default: "" },
            emailAddress: { type: String, lowercase: true, trim: true, default: "" },
            passportNumber: { type: String, uppercase: true, trim: true, default: "" },
            cnic: { type: String, trim: true, default: "" },
            profilePhoto: { type: String, default: "" },
        },

        academicBackground: {
            highSchoolName: { type: String, trim: true, default: "" },
            yearOfGraduation: { type: Number },
            boardOrUniversity: { type: String, trim: true, default: "" },
            gpaOrPercentage: { type: String, trim: true, default: "" },
            transcriptUpload: { type: String, default: "" },
            schools: { type: [schoolSchema], default: [] },
        },

        languageProficiency: {
    examType: {
        type: String,
        enum: ["IELTS", "TOEFL", "PTE", "Not Required", ""],
        default: "Not Required",
    },
    score: { 
        type: String, 
        default: "", 
        trim: true,
        required: function() {
            return this.languageProficiency?.examType && this.languageProficiency.examType !== "Not Required";
        }
    },
    examDateOrExpiry: { type: String, default: "", trim: true },
    IELTSresult: { type: String, default: "" },
},

        programInterest: {
            programType: {
                type: String,
                enum: ["Undergraduate", "Graduate", "Diploma", "Short Course", ""],
                default: "",
            },
            fieldOfStudy: { type: String, trim: true, default: "" },
            interestedCountry: { type: String, trim: true, default: "" },
            preferredUniversities: [universityOptionSchema],
            intakeSeason: { type: String, enum: ["Fall", "Spring", "Summer", "Winter", ""], default: "" },
            modeOfStudy: {
                type: String,
                enum: ["On-campus", "Online", "Hybrid", ""],
                default: "On-campus",
            },
        },

        experienceInfo: {
            workHistory: [workExperienceSchema],
            internshipsOrProjects: { type: String, default: "" },
            extracurricularAndLeadership: { type: String, default: "" },
            volunteerExperience: { type: String, default: "" },
        },

        financialAndVisa: {
            fundingSource: {
                type: String,
                enum: ["Self-funded", "Scholarship", "Educational Loan", ""],
                default: "",
            },
            passportExpiryDate: { type: Date },
        },

        attachments: {
            resumeCv: { type: String, default: "" },
            statementOfPurpose: { type: String, default: "" },
            lettersOfRecommendation: { type: [String], default: [] },
            passportCopyUpload: { type: String, default: "" },
            nationalIdProof: { type: String, default: "" },
        },

        applicationStatus: {
            type: String,
            enum: ["Draft", "Pending", "Under Review", "Document Missing", "Approved", "Rejected"],
            default: "Draft",
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    { timestamps: true }
);

const VisaApplication = mongoose.model("VisaApplication", visaApplicationSchema);
export default VisaApplication;
