import express from "express";
import globalAPI from "./beynum.api.js";
import api from "./footballvid.api.js";
import data from "./footballvid.data.js";

import client from "superagent";

const router = express.Router();

// ************************* Middleware

router.use(globalAPI.loadSetup);
router.use(globalAPI.authenticate);

// ************************* Data

router.get("/footballvid/data/image", globalAPI.validateInternal, data.imageGet);
router.post("/footballvid/data/image", globalAPI.validateInternal, data.imageSave);
router.delete("/footballvid/data/image", globalAPI.validateInternal, data.imageDelete);

// ************************* API

router.get("/footballvid/test", globalAPI.validateInternal, (request, response) => { response.status(200).json({ status: "ok" })});

router.get("/footballvid/test2", (request, response) => {
	client.get(`${ request.serverPath }/footballvid/data/image`)
		.set("isinternal", "true")
		.then(() => response.status(200).json({ status: "ok" }))
		.catch(error => response.status(560).json({ error: error.message }));
});

router.post("/footballvid/uploadvideo", api.hasAccess, api.uploadVideo);
router.post("/footballvid/uploadimagedata", api.hasAccess, api.uploadImageData);

export default router;
