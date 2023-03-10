import express from "express";
import api from "./sys.api.js";
import data from "./sys.data.js";

const router = express.Router();

// ************************* Middleware

// ************************* Data

router.get("/sys/data/logtype", data.logTypeGet);
router.post("/sys/data/logtype", data.logTypeSave);
router.delete("/sys/data/logtype", data.logTypeDelete);

router.get("/sys/data/log", data.logGet);
router.post("/sys/data/log", data.logSave);
router.delete("/sys/data/log", data.logDelete);

router.get("/sys/data/job", data.jobGet);
router.post("/sys/data/job", data.jobSave);
router.delete("/sys/data/job", data.jobDelete);

// ************************* API

router.post("/sys/api/addlog", api.addLog);

router.get("/sys/api/getjobs", api.getJobs);
router.post("/sys/api/savejobrun", api.saveJobRun);
router.get("/sys/api/getrun", api.getRun);

export default router;