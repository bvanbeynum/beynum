import mongoose from "mongoose";
import config from "./config.js";

// const cnFinance = mongoose.createConnection("mongodb://" + config.db.finance.user + ":" + config.db.finance.pass + "@" + config.db.servers.join(",") + "/" + config.db.finance.db + "?authSource=" + config.db.finance.authDB, {useNewUrlParser: true, useUnifiedTopology: true });

export default {

	// transaction: cnFinance.model("transaction", {
	// 	transactionDate: Date,
	// 	amount: Number,
	// 	description: String,
	// 	category: String
	// })

};
