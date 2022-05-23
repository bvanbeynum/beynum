import mongoose from "mongoose";
import config from "./config.js";

const cnBlackJack = mongoose.createConnection(`mongodb://${config.db.blackJack.user}:${config.db.blackJack.pass}@${config.db.servers.join(",")}/${config.db.blackJack.db}?authSource=${config.db.blackJack.authDB}`, {useNewUrlParser: true, useUnifiedTopology: true });

export default {

	game: cnBlackJack.model("game", {
		start: Date,
		end: Date,
		startingAmount: Number,
		currentAmount: Number,
		transactions: [ Number ]
	})

};
