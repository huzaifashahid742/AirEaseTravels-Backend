import jwt from "jsonwebtoken";
import User from "../Modals/UserSign.js";
import { hasPermission, isStaffRole } from "../constants/roles.js";

export const protect = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization || "";
        const token = authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

        if (!token) {
            return res.status(401).json({ success: false, message: "Unauthorized. Token is required." });
        }

        // Verify token signature safely
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Fetch the associated user profile
        const user = await User.findById(decoded.id).select("-password");

        if (!user) {
            return res.status(401).json({ success: false, message: "Unauthorized. User does not exist." });
        }

        req.user = user;
        next();
    } catch (error) {
        // FIXED: Differentiate between a token validation failure and a critical system/DB crash
        if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
            return res.status(401).json({ 
                success: false, 
                message: error.name === "TokenExpiredError" 
                    ? "Unauthorized. Token has expired." 
                    : "Unauthorized. Invalid token signature." 
            });
        }
        
        // Handover unexpected system/database driver failures to your global centralized error handler middleware
        next(error);
    }
};

export const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ success: false, message: "Forbidden. You do not have permission." });
        }
        next();
    };
};

/** Any staff role (admin panel access) */
export const authorizeStaff = (req, res, next) => {
    if (!req.user || !isStaffRole(req.user.role)) {
        return res.status(403).json({ success: false, message: "Forbidden. Staff access required." });
    }
    next();
};

/** Permission key from constants/roles.js PERMISSIONS */
export const authorizePermission = (permission) => (req, res, next) => {
    if (!req.user || !hasPermission(req.user.role, permission)) {
        return res.status(403).json({ success: false, message: "Forbidden. You do not have permission." });
    }
    next();
};
