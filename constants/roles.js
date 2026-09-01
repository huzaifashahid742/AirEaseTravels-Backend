export const ROLES = {
    USER: "user",
    SUPER_ADMIN: "SuperAdmin",
    ADMIN: "Admin",
    ADMISSIONS: "Admissions",
    CONTENT: "Content",
};

export const STAFF_ROLES = [
    ROLES.SUPER_ADMIN,
    ROLES.ADMIN,
    ROLES.ADMISSIONS,
    ROLES.CONTENT,
];
export const ASSIGNABLE_STAFF_ROLES = [
    ROLES.ADMIN,
    ROLES.ADMISSIONS,
    ROLES.CONTENT,
];

export const ROLE_LABELS = {
    [ROLES.USER]: "Student",
    [ROLES.SUPER_ADMIN]: "Super Admin",
    [ROLES.ADMIN]: "Administrator",
    [ROLES.ADMISSIONS]: "Admissions",
    [ROLES.CONTENT]: "Content Manager",
};

export const PERMISSION_LABELS = {
    manageTeam: "Team & roles",
    universities: "Universities",
    programs: "Programs",
    countryDetails: "Country comparisons",
    applications: "Applications",
    students: "Student records",
};

export const PERMISSIONS = {
    manageTeam: [ROLES.SUPER_ADMIN, ROLES.ADMIN],
    universities: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.CONTENT],
    programs: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.CONTENT],
    countryDetails: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.CONTENT],
    applications: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.ADMISSIONS],
    students: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.ADMISSIONS],
};

export const isStaffRole = (role) => STAFF_ROLES.includes(role);

export const isStudentRole = (role) =>
    !role || role === ROLES.USER || String(role).toLowerCase() === "user";

export const hasPermission = (role, permission) =>
    Boolean(PERMISSIONS[permission]?.includes(role));

export const getAssignableRolesFor = (actorRole) => {
    if (actorRole === ROLES.SUPER_ADMIN) {
        return [
            { value: ROLES.USER, label: `${ROLE_LABELS[ROLES.USER]} (revoke staff access)` },
            ...ASSIGNABLE_STAFF_ROLES.map((r) => ({ value: r, label: ROLE_LABELS[r] })),
        ];
    }
    if (actorRole === ROLES.ADMIN) {
        return [
            { value: ROLES.USER, label: `${ROLE_LABELS[ROLES.USER]} (revoke staff access)` },
            { value: ROLES.ADMISSIONS, label: ROLE_LABELS[ROLES.ADMISSIONS] },
            { value: ROLES.CONTENT, label: ROLE_LABELS[ROLES.CONTENT] },
        ];
    } 
    return [];
};

export const getInviteableRolesFor = (actorRole) =>
    getAssignableRolesFor(actorRole).filter((r) => r.value !== ROLES.USER);

export const canAssignRole = (actorRole, targetRole) =>
    getAssignableRolesFor(actorRole).some((r) => r.value === targetRole);

export const canManageUser = (actorRole, targetRole) => {
    if (actorRole === ROLES.SUPER_ADMIN) return true;
    if (actorRole === ROLES.ADMIN) {
        return isStudentRole(targetRole) || [ROLES.ADMISSIONS, ROLES.CONTENT].includes(targetRole);
    }
    return false;
};
