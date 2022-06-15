import mongoose from "mongoose";
import config from "./config.js";

const cnBlackJack = mongoose.createConnection(`mongodb://${config.db.blackJack.user}:${config.db.blackJack.pass}@${config.db.servers.join(",")}/${config.db.blackJack.db}?authSource=${config.db.blackJack.authDB}`, {useNewUrlParser: true, useUnifiedTopology: true });

const cardSchema = new mongoose.Schema({ card: String, suit: String });

const handSchema = new mongoose.Schema({
	cards: [{ type: cardSchema }],
	value: Number,
	bet: Number,
	isComplete: Boolean,
	result: Number
});

export default {

	game: cnBlackJack.model("game", {
		start: Date,
		lastUpdate: Date,
		userId: String,
		transactions: [ Number ]
	}),

	user: cnBlackJack.model("user", {
		firstName: String,
		lastName: String,
		createdDate: Date,
		email: String,
		devices: [{
			lastAccess: Date,
			agent: String,
			ip: String,
			domain: String,
			token: String
		}],
		tokens: [ String ],
	}),

	gameState: cnBlackJack.model("gameState", {
		hands: {
			player: { type: handSchema },
			split: { type: handSchema },
			dealer: { type: handSchema }
		},
		deck: { cards: [{ type: cardSchema }], index: Number },
		transactions: [ Number ],
		settings: {
			startTime: Date,
			bank: Number,
			currentBet: Number,
			isPlaying: Boolean,
			blackjackPayout: Number
		}
	})

};
