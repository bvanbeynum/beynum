import mongoose from "mongoose";
import config from "./config.js";

const cnBeynum = mongoose.createConnection(`mongodb://${config.db.beynum.user}:${config.db.beynum.pass}@${config.db.servers.join(",")}/${config.db.beynum.db}?authSource=${config.db.beynum.authDB}`, {useNewUrlParser: true, useUnifiedTopology: true });

export default {

	user: cnBeynum.model("user", {
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

	job: cnBeynum.model("job", {
		name: String,
		frequencySeconds: Number,
		scriptName: String,
		created: Date,
		modified: Date,
		runs: [{
			startTime: Date,
			completeTime: Date,
			messages: [{ severity: Number, message: String, time: Date }]
		}]
	})

};
