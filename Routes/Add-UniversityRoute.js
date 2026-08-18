import express from "express";
import { createUniversity, deleteUniversity, getUniversities, getUniversityById, updateUniversity } from "../Controllers/Add-UniversityController.js";
import { authorizePermission, protect } from "../middleware/authMiddleware.js";
import { upload } from "../middleware/uploadMiddleware.js"; // Import multer middleware

const router = express.Router();

router.get("/", getUniversities);
router.get("/:id", getUniversityById);

// Added upload.single("logo") to process files via Cloudinary
router.post("/", protect, authorizePermission("universities"), upload.single("logo"), createUniversity);
router.put("/:id", protect, authorizePermission("universities"), upload.single("logo"), updateUniversity);
router.delete("/:id", protect, authorizePermission("universities"), deleteUniversity);

export default router;