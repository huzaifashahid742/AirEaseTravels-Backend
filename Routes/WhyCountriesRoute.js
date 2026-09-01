import express from "express";
import { createCountryDetail, getCountryDetails, updateCountryDetail } from "../Controllers/WhyCountriesController.js";
import { authorizePermission, protect } from "../middleware/authMiddleware.js";
import { upload } from "../middleware/uploadMiddleware.js";

const Whyrouter = express.Router();

Whyrouter.get("/", getCountryDetails);
Whyrouter.post("/", protect, authorizePermission("countryDetails"), upload.single("flagImage"), createCountryDetail);
Whyrouter.put("/:id", protect, authorizePermission("countryDetails"), upload.single("flagImage"), updateCountryDetail);

export default Whyrouter;