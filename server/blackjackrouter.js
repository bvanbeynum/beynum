import express from "express";
import lib from "./middleware.js";
import data from "./blackjackdata.js";
import api from "./blackjackapi.js";

const router = express.Router();

// ************************* Middleware

router.use(lib.loadSetup);

// ************************* Data

router.get("/data/game", data.gameGet);
router.post("/data/game", data.gameSave);
router.delete("/data/game", data.gameDelete);

// ************************* API

router.get("/api/blackjackload", api.blackJackLoad);
router.post("/api/savegame", api.saveGame);
router.post("/api/savegamehand", api.saveGameHand);
router.delete("/api/deletegame", api.deleteGame);

// ************************* Static

export default router;
