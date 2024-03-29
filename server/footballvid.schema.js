import mongoose from "mongoose";
import config from "./config.js";

const cnBeynum = mongoose.createConnection(`mongodb://${config.db.beynum.user}:${config.db.beynum.pass}@${config.db.servers.join(",")}/${config.db.beynum.db}?authSource=${config.db.beynum.authDB}`, {useNewUrlParser: true, useUnifiedTopology: true });

export default {

	image: cnBeynum.model("image", {
		fileName: String,
		createdDate: Date
	})

};
