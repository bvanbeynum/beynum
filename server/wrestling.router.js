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
router.get("/wrestling/data/image", data.imageGet);
router.post("/wrestling/data/image", data.imageSave);
router.delete("/wrestling/data/image", data.imageDelete);
router.get("/wrestling/data/wrestler", data.wrestlerGet);
router.post("/wrestling/data/wrestler", data.wrestlerSave);
router.delete("/wrestling/data/wrestler", data.wrestlerDelete);

// ************************* API

router.get("/wrestling/api/eventload", api.eventLoad);
router.post("/wrestling/api/eventdetails", api.eventDetails);
router.post("/wrestling/api/getallwrestlers", api.getAllWrestlers);

router.post("/wrestling/api/uploadimage", api.uploadImage);
router.post("/wrestling/api/getimage", api.getImage);

router.post("/wrestling/api/getwrestler", api.getWrestler);
router.post("/wrestling/api/savewrestlers", api.saveWrestlers);
router.post("/wrestling/api/deletewrestlers", api.deleteWrestlers);

export default router;
