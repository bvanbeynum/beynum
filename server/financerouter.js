import express from "express";
import config from "./config.js";
import lib from "./middleware.js";
import data from "./financedata.js";
import api from "./financeapi.js";

const router = express.Router();

// ************************* Middleware

router.use(lib.loadSetup);

// ************************* Data

router.get("/data/transaction", data.transactionGet);
router.post("/data/transaction", data.transactionSave);
router.delete("/data/transaction", data.transactionDelete);

// ************************* API

router.get("/api/financeLoad", api.financeLoad);
router.post("/api/uploadtransactions", api.uploadTransactions);

// ************************* Static

export default router;
