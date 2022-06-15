import express from "express";
import lib from "./middleware.js";
import data from "./blackjackdata.js";
import api from "./blackjackapi.js";

const router = express.Router();

// ************************* Middleware

router.use(lib.loadSetup);
router.use(api.authenticate);

// ************************* Data

router.get("/bj/data/user", data.userGet);
router.post("/bj/data/user", data.userSave);
router.delete("/bj/data/user", data.userDelete);

router.get("/bj/data/game", data.gameGet);
router.post("/bj/data/game", data.gameSave);
router.delete("/bj/data/game", data.gameDelete);

router.get("/bj/data/gamestate", data.gameStateGet);
router.post("/bj/data/gamestate", data.gameStateSave);
router.delete("/bj/data/gamestate", data.gameStateDelete);

// ************************* API

router.get("/blackjack", api.validate);

router.get("/bj/api/blackjackload", api.blackJackLoad);
router.post("/bj/api/savegame", api.saveGame);
router.post("/bj/api/savegametransaction", api.saveGameTransaction);
router.delete("/bj/api/deletegame", api.deleteGame);

router.get("/bj/api/game/new", api.gameNew);
router.get("/bj/api/game/deal", api.gameDeal);
router.get("/bj/api/game/play", api.gamePlay);

// ************************* Static

export default router;
