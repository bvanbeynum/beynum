import express from "express";
import mongoose from "mongoose";
import config from "./config.js";
import data from "./officedata.js";
import api from "./officeapi.js";

const { connect } = mongoose;
const router = express.Router();

connect("mongodb://" + config.db.user + ":" + config.db.pass + "@" + config.db.servers.join(",") + "/" + config.db.db + "?authSource=" + config.db.authDB, {useNewUrlParser: true, useUnifiedTopology: true });

// ************************* Data

router.get("/data/sensorlog", data.sensorLogGet);
router.post("/data/sensorlog", data.sensorLogSave);
router.delete("/data/sensorlog", data.sensorLogDelete);

router.get("/data/command", data.commandGet);
router.post("/data/command", data.commandSave);
router.delete("/data/command", data.commandDelete);

// ************************* API

router.post("/api/sensorsave", api.sensorLogSave);
router.post("/api/commandsave", api.commandSave);

// ************************* Static

router.get("/", (request, response) => response.send("Ok"));

export default router;
