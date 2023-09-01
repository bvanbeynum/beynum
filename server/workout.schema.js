import mongoose from "mongoose";
import config from "./config.js";


const cnBeynum = mongoose.createConnection(`mongodb://${config.db.beynum.user}:${config.db.beynum.pass}@${config.db.servers.join(",")}/${config.db.beynum.db}?authSource=${config.db.beynum.authDB}`, {useNewUrlParser: true, useUnifiedTopology: true });

const exerciseSchema = new mongoose.Schema({
	name: String,
	category: String,
	hasWeight: Boolean,
	hasBar: Boolean,
	created: Date,
	modified: Date
});

export default {

	exercise: cnBeynum.model("workoutExercise", exerciseSchema),

	activity: cnBeynum.model("workoutActivity", {
		userId: String,
		sets: [{
			exercise: exerciseSchema,
			reps: Number,
			weight: Number
		}],
		created: Date,
		modified: Date
	})

};