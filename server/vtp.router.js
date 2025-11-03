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

export default router;
