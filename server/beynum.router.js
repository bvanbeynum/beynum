import express from "express";
import lib from "./middleware.js";
import data from "./beynum.data.js";
import api from "./beynum.api.js";

const router = express.Router();

// ************************* Middleware

router.use(lib.loadSetup);

// ************************* Data

router.get("/data/user", data.userGet);
router.post("/data/user", data.userSave);
router.delete("/data/user", data.userDelete);

router.get("/data/job", data.jobGet);
router.post("/data/job", data.jobSave);
router.delete("/data/job", data.jobDelete);

// ************************* API

router.get("/api/getjobs", api.getJobs);
router.post("/api/savejobrun", api.saveJobRun);

export default router;
