import express from "express";
import data from "./vtp.data.js";
import api from "./vtp.api.js";

const router = express.Router();

// ************************* Middleware

// ************************* Data

router.get("/vtp/data/vtpuser", data.vtpUserGet);
router.post("/vtp/data/vtpuser", data.vtpUserSave);
router.delete("/vtp/data/vtpuser", data.vtpUserDelete);

// ************************* API

router.get("/vtp/auth/google", api.authGoogle);
router.get("/vtp/auth/google/callback", api.authGoogleCallback);

router.get("/vtp/api/coachbroadcast", api.coachBroadcast);
router.get("/vtp/api/teamfunds", api.teamFunds);
router.post("/vtp/api/saveindexsheet", api.saveIndexSheet);

export default router;
