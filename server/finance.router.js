import express from "express";
import globalAPI from "./beynum.api.js";
import data from "./finance.data.js";
import api from "./finance.api.js";

const router = express.Router();

// router.use(globalAPI.authenticate);

// ************************* API

// router.post("/api/requestaccess", [authAPI, browser.express()], async (request, response) => {
// 	let ipAddress = (request.headers["x-forwarded-for"] || "").split(",").pop().trim() || 
// 		request.connection.remoteAddress || 
// 		request.socket.remoteAddress || 
// 		request.connection.socket.remoteAddress;
// 	ipAddress = ipAddress.match(/[^:][\d.]+$/g).join("");

// 	const domain = request.headers.host;

// 	const results = await api.requestAccess(ipAddress, domain, request.body.name, request.body.email, request.useragent, request.serverPath);

// 	if (results.error) {
// 		client.post(request.logUrl).send({ log: { logTime: new Date(), logTypeId: "642202d038baa8f160a2c6bb", message: `${ results.status }: ${results.error}` }}).then();
// 	}

// 	response.cookie("wm", results.cookie, { maxAge: 999999999999 });
// 	response.status(results.status).json(results.error ? { error: results.error } : results.data);
// 	response.end();
// });

router.get("/finance/api/load", api.load);
router.get("/finance/api/transactionsget", api.transactionsGet);
router.post("/finance/api/transactionsave", api.transactionSave);
router.post("/finance/api/transactionbulksave", api.transactionBulkSave);

// ************************* Data

router.get("/finance/data/category", data.categoryGet);

router.get("/finance/data/transaction", data.transactionGet);
router.post("/finance/data/transaction", data.transactionSave);
router.delete("/finance/data/transaction", data.transactionDelete);

export default router;
