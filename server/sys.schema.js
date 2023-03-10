import mongoose from "mongoose";
import config from "./config.js";

const cnBeynum = mongoose.createConnection(`mongodb://${config.db.beynum.user}:${config.db.beynum.pass}@${config.db.servers.join(",")}/${config.db.beynum.db}?authSource=${config.db.beynum.authDB}`, {useNewUrlParser: true, useUnifiedTopology: true });

export default {

    logType: cnBeynum.model("sysLogType", {
        app: String,
        module: String,
        function: String
    }),

    log: cnBeynum.model("sysLog", {
        logTime: Date,
        logTypeId: String,
        message: String
    }),

	job: cnBeynum.model("sysJob", {
		name: String,
		frequencySeconds: Number,
		scriptName: String,
		created: Date,
		modified: Date,
		runs: [{
			startTime: Date,
			completeTime: Date,
			isKill: Boolean,
			messages: [{ severity: Number, message: String, time: Date }]
		}]
	}),

	urlStatus: cnBeynum.model("sysUrlStatus", {
		name: String,
		url: String,
		created: Date,
		modified: Date
	})

};