import express from "express";
import data from "./beynum.data.js";
import api from "./beynum.api.js";

const router = express.Router();

// ************************* Middleware

// ************************* Data

router.get("/data/user", data.userGet);
router.post("/data/user", data.userSave);
router.delete("/data/user", data.userDelete);

// ************************* API

export default router;
