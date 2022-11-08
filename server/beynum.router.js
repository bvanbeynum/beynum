import express from "express";
import lib from "./middleware.js";
import data from "./beynum.data.js";

const router = express.Router();

// ************************* Middleware

router.use(lib.loadSetup);

// ************************* Data

router.get("/data/user", data.userGet);
router.post("/data/user", data.userSave);
router.delete("/data/user", data.userDelete);

export default router;
