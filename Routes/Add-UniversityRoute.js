import express from "express";
import { createUniversity, deleteUniversity, getUniversities, getUniversityById, updateUniversity } from "../Controllers/Add-UniversityController.js";
import { authorizePermission, protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Route for creating a university
router.get("/", getUniversities);
router.get("/:id", getUniversityById);
router.post("/", protect, authorizePermission("universities"), createUniversity);
router.put("/:id", protect, authorizePermission("universities"), updateUniversity);
router.delete("/:id", protect, authorizePermission("universities"), deleteUniversity);

export default router;