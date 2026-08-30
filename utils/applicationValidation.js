const CURRENT_YEAR = new Date().getFullYear();
const MIN_GRADUATION_YEAR = 1950;

export const validateGraduationYear = (year, label = "Year of completion") => {
    if (year === undefined || year === null || year === "") {
        return `${label} is required`;
    }
    const y = Number(year);
    if (Number.isNaN(y) || !Number.isInteger(y)) {
        return `${label} must be a valid 4-digit year`;
    }
    if (String(y).length !== 4) {
        return `${label} must be a 4-digit year`;
    }
    if (y < MIN_GRADUATION_YEAR) {
        return `${label} must be ${MIN_GRADUATION_YEAR} or later`;
    }
    if (y > CURRENT_YEAR) {
        return `${label} cannot be after ${CURRENT_YEAR}`;
    }
    return null;
};

/** Validate mandatory fields before final submission (drafts skip this). */
export const validateApplicationSubmit = (body) => {
    const errors = [];
    const p = body.personalInfo || {};
    const a = body.academicBackground || {};
    const l = body.languageProficiency || {};
    const prog = body.programInterest || {};
    const f = body.financialAndVisa || {};
    const att = body.attachments || {};

    if (!p.fullName?.trim()) errors.push("Full name is required");
    if (!p.dateOfBirth) errors.push("Date of birth is required");
    if (!p.gender) errors.push("Gender is required");
    if (!p.nationality?.trim()) errors.push("Nationality is required");
    if (!p.countryOfResidence?.trim()) errors.push("Country of residence is required");
    if (!p.currentAddress?.trim()) errors.push("Current address is required");
    if (!p.contactNumber?.trim()) errors.push("Contact number is required");
    if (!p.emailAddress?.trim()) errors.push("Email is required");
    if (!p.passportNumber?.trim()) errors.push("Passport number is required");

    if (!a.highSchoolName?.trim()) errors.push("High school name is required");
    const primaryYearError = validateGraduationYear(a.yearOfGraduation, "Year of graduation");
    if (primaryYearError) errors.push(primaryYearError);
    if (!a.boardOrUniversity?.trim()) errors.push("Board / university is required");
    if (!a.gpaOrPercentage?.trim()) errors.push("GPA / percentage is required");
    if (!a.transcriptUpload?.trim()) errors.push("Transcript upload is required");

    (a.schools || []).forEach((school, index) => {
        const recordLabel = `Additional academic record ${index + 1}`;
        if (!school.schoolName?.trim()) errors.push(`${recordLabel}: school name is required`);
        const schoolYearError = validateGraduationYear(school.graduationYear, `${recordLabel} year of completion`);
        if (schoolYearError) errors.push(schoolYearError);
        if (!school.boardOrUniversity?.trim()) errors.push(`${recordLabel}: board / university is required`);
        if (!school.gpaOrPercentage?.trim()) errors.push(`${recordLabel}: GPA / percentage is required`);
        if (!school.resultUpload?.trim()) errors.push(`${recordLabel}: result upload is required`);
    });

    if (!prog.programType) errors.push("Program type is required");
    if (!prog.fieldOfStudy?.trim()) errors.push("Field of study is required");
    if (!prog.interestedCountry?.trim()) errors.push("Interested country is required");
    if (!prog.intakeSeason) errors.push("Intake season is required");
    if (!prog.modeOfStudy) errors.push("Mode of study is required");

    if (!f.fundingSource) errors.push("Funding source is required");
    if (!f.passportExpiryDate) errors.push("Passport expiry date is required");

    if (!att.resumeCv?.trim()) errors.push("Resume / CV is required");
    if (!att.passportCopyUpload?.trim()) errors.push("Passport copy is required");
    if (!att.nationalIdProof?.trim()) errors.push("National ID proof is required");

    if (l.examType && l.examType !== "Not Required" && l.examType !== "") {
        if (!l.score?.trim()) {
            errors.push("Language test score is required when an exam type is selected");
        }
        if (!l.IELTSresult?.trim()) {
            errors.push("Language test result document is required when an exam type is selected");
        }
    }

    return errors;
};
