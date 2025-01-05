import mongoose from "mongoose";
import config from "./config.js";

const cnBeynum = mongoose.createConnection(`mongodb://${config.db.beynum.user}:${config.db.beynum.pass}@${config.db.servers.join(",")}/${config.db.beynum.db}?authSource=${config.db.beynum.authDB}`, {useNewUrlParser: true, useUnifiedTopology: true });

export default {

	transaction: cnBeynum.model("financeTransaction", {
		source: String,
        transactionDate: Date,
        description: String,
        amount: Number,
        descriptionOverride: String,
        category: String,
        created: Date,
        modified: Date
	})

};
