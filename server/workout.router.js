import express from "express";
import globalAPI from "./beynum.api.js";
import data from "./workout.data.js";
import api from "./workout.api.js";

const router = express.Router();

router.use(globalAPI.authenticate);

// ************************* API

router.get("/workout/api/load", [ globalAPI.authAPI, api.authenticate ], api.load);

// ************************* Data

router.get("/workout/data/exercise", globalAPI.authInternal, data.exerciseGet);
router.post("/workout/data/exercise", globalAPI.authInternal, data.exerciseSave);
router.delete("/workout/data/exercise", globalAPI.authInternal, data.exerciseDelete);

router.get("/workout/data/activity", globalAPI.authInternal, data.activityGet);
router.post("/workout/data/activity", globalAPI.authInternal, data.activitySave);
router.delete("/workout/data/activity", globalAPI.authInternal, data.activityDelete);

export default router;
