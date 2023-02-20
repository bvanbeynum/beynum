import mongoose from "mongoose";
import config from "./config.js";

const cnBeynum = mongoose.createConnection(`mongodb://${config.db.beynum.user}:${config.db.beynum.pass}@${config.db.servers.join(",")}/${config.db.beynum.db}?authSource=${config.db.beynum.authDB}`, {useNewUrlParser: true, useUnifiedTopology: true });

export default {

	event: cnBeynum.model("wrestlingEvent", {
		flowId: String,
		name: String,
		location: String,
		city: String,
		state: String,
		startDate: Date,
		endDate: Date,
		isLoaded: Boolean,
		lastRefresh: Date,
		isFlagged: Boolean,
		divisions: [{
			flowId: String,
			name: String,
			sort: Number,
			weightClasses: [{
				flowId: String,
				name: String,
				sort: Number,
				pools: [{
					flowId: String,
					name: String,
					sort: Number,
					matches: [{
						flowId: String,
						matchNumber: String,
						mat: {
							flowId: String,
							name: String
						},
						result: String,
						winType: String,
						round: String,
						sort: Number,
						wrestler1: {
							flowId: String,
							firstName: String,
							lastName: String,
							teamFlowId: String,
							team: String,
							isWinner: Boolean
						},
						wrestler2: {
							flowId: String,
							firstName: String,
							lastName: String,
							teamFlowId: String,
							team: String,
							isWinner: Boolean
						}
					}]
				}],
				matches: [{
					flowId: String,
					name: String,
					roundName: String,
					winType: String,
					videoUrl: String,
					athletes: [{
						flowId: String,
						firstName: String,
						lastName: String,
						team: String,
						isWinner: Boolean
					}]
				}]
			}]
		}]
	}),

	eventUpdate: cnBeynum.model("wrestlingEventUpdate", {
		eventFlowId: String,
		type: String,
		time: Date,
		division: String,
		weightClass: String,
		round: String,
		teams: [String],
		message: String
	}),

	athlete: cnBeynum.model("wrestlingAthlete", {
		flowId: String,
		firstName: String,
		lastName: String,
		team: String,
		events: [{
			id: String,
			flowId: String,
			name: String,
			location: String,
			startDate: Date,
			endDate: Date
		}],
		matches: [{
			eventId: String,
			vs: { 
				id: String,
				flowId: String,
				firstName: String,
				lastName: String,
				team: String
			},
			isWin: Boolean,
			winType: String
		}]
	}),

	image: cnBeynum.model("wrestlingImage", {
		imageName: String,
		categories: [String],
		created: Date,
		modified: Date
	}),

	wrestler: cnBeynum.model("wrestlingWrestler", {
		dbId: Number,
		flowId: String,
		firstName: String,
		lastName: String,
		team: String,
		state: String,
		division: String,
		weightClass: String,
		ranking: Number,
		meets: [{
			flowId: String,
			name: String,
			location: { name: String, city: String, state: String },
			startDate: Date,
			endDate: Date,
			division: String,
			weightClass: String,
			matches: [{
				round: String,
				vs: { name: String, team: String, dbId: Number, flowId: String },
				isWin: Boolean,
				winType: String,
				sort: Number,
				points: Number
			}]
		}],
		lastModified: Date
	})

};
