import mongoose from "mongoose";
import config from "./config.js";

const cnBlackJack = mongoose.createConnection(`mongodb://${config.db.blackJack.user}:${config.db.blackJack.pass}@${config.db.servers.join(",")}/${config.db.blackJack.db}?authSource=${config.db.blackJack.authDB}`, {useNewUrlParser: true, useUnifiedTopology: true });

export default {

	game: cnBlackJack.model("game", {
		start: Date,
		lastUpdate: Date,
		userId: String,
		hands: [{
			player: [ String ],
			split: [ String ],
			dealer: [ String ],
			bank: Number
		}]
	}),

	user: cnBlackJack.model("user", {
		firstName: String,
		lastName: String,
		createdDate: Date,
		email: String,
		teams: [String],
		devices: [{
			lastAccess: Date,
			agent: String,
			ip: String,
			domain: String,
			token: String
		}],
		tokens: [ String ],
	})

};
