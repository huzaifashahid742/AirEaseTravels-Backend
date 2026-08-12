import express from "express";
import { createProgram, deleteProgram, getProgramById, getPrograms, updateProgram } from "../Controllers/Add-ProgramController.js";
import { authorizePermission, protect } from "../middleware/authMiddleware.js";

const Programrouter = express.Router();

Programrouter.get("/", getPrograms);
Programrouter.get("/:id", getProgramById);
Programrouter.post("/", protect, authorizePermission("programs"), createProgram);
Programrouter.put("/:id", protect, authorizePermission("programs"), updateProgram);
Programrouter.delete("/:id", protect, authorizePermission("programs"), deleteProgram);

export default Programrouter;