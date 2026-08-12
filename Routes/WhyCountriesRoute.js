import express from "express";
import { createCountryDetail, getCountryDetails, updateCountryDetail } from "../Controllers/WhyCountriesController.js";
import { authorizePermission, protect } from "../middleware/authMiddleware.js";
import { upload } from "../middleware/uploadMiddleware.js";

const Whyrouter = express.Router();

Whyrouter.get("/", getCountryDetails);
Whyrouter.post("/",upload.single("flagImage"), protect, authorizePermission("countryDetails"), createCountryDetail);
Whyrouter.put("/:id",upload.single("flagImage"), protect, authorizePermission("countryDetails"),  updateCountryDetail);

export default Whyrouter;