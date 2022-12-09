import express from "express";
import globalAPI from "./beynum.api.js";
import api from "./wrestling.api.js";
import data from "./wrestling.data.js";

const router = express.Router();

// ************************* Middleware

// ************************* Data

router.get("/wrestling/data/event", data.eventGet);
router.post("/wrestling/data/event", data.eventSave);
router.delete("/wrestling/data/event", data.eventDelete);
router.get("/wrestling/data/athlete", data.athleteGet);
router.post("/wrestling/data/athlete", data.athleteSave);
router.delete("/wrestling/data/athlete", data.athleteDelete);

// ************************* API

router.get("/wrestling/api/eventload", api.eventLoad);
router.post("/wrestling/api/eventdetails", api.eventDetails);

export default router;
