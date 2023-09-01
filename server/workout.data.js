import data from "./workout.schema.js";
import client from "superagent";
import mongoose from "mongoose";

export default {

	exerciseGet: (request, response) => {
		const filter = {};

		if (request.query.id) {
			filter["_id"] = mongoose.Types.ObjectId.isValid(request.query.id) ? request.query.id : null;
		}

		data.exercise.find(filter)
			.lean()
			.exec()
			.then(records => {
				const output = { exercises: records.map(({ _id, __v, ...data }) => ({ id: _id, ...data })) };
				response.status(200).json(output);
			})
			.catch(error => {
				client.post(request.logUrl).send({ log: { logTime: new Date(), logTypeId: "64428d9c38baa8f160ae86ac", message: `560: ${error.message}` }}).then();
				response.status(560).json({ error: error.message });
			});
	},

	exerciseSave: (request, response) => {
		if (!request.body.exercise) {
			response.status(550).json({ error: "Missing object to save" });
			return;
		}
		
		const save = request.body.exercise;

		if (save.id) {
			data.exercise.findById(save.id)
				.exec()
				.then(data => {
					if (!data) {
						throw new Error("Record not found");
					}

					Object.keys(save).forEach(field => {
						if (field != "id") {
							data[field] = save[field];
						}
					});
					data.modified = new Date();

					return data.save();
				})
				.then(data => {
					response.status(200).json({ id: data._id });
				})
				.catch(error => {
					client.post(request.logUrl).send({ log: { logTime: new Date(), logTypeId: "64428dc538baa8f160ae86ae", message: `570: ${error.message}` }}).then();
					response.status(570).json({ error: error.message });
				});
		}
		else {
			new data.exercise({ ...save, created: new Date(), modified: new Date() })
				.save()
				.then(data => {
					response.status(200).json({ id: data._id });
				})
				.catch(error => {
					client.post(request.logUrl).send({ log: { logTime: new Date(), logTypeId: "64428dc538baa8f160ae86ae", message: `571: ${error.message}` }}).then();
					response.status(571).json({ error: error.message });
				});
		}
	},

	exerciseDelete: (request, response) => {
		if (!request.query.id || !mongoose.Types.ObjectId.isValid(request.query.id)) {
			response.status(550).json({ error: "Missing ID to delete" });
			return;
		}

		data.exercise.deleteOne({ _id: request.query.id })
			.then(() => {
				response.status(200).json({ status: "ok" });
			})
			.catch(error => {
				client.post(request.logUrl).send({ log: { logTime: new Date(), logTypeId: "64428dd838baa8f160ae86b1", message: `560: ${error.message}` }}).then();
				response.status(560).json({ error: error.message });
			});
	},

	activityGet: (request, response) => {
		const filter = {};

		if (request.query.id) {
			filter["_id"] = mongoose.Types.ObjectId.isValid(request.query.id) ? request.query.id : null;
		}
		if (request.query.userid) {
			filter.userId = request.query.userid;
		}

		data.activity.find(filter)
			.lean()
			.exec()
			.then(records => {
				const output = { activitys: records.map(({ _id, __v, ...data }) => ({ id: _id, ...data })) };
				response.status(200).json(output);
			})
			.catch(error => {
				client.post(request.logUrl).send({ log: { logTime: new Date(), logTypeId: "64428df138baa8f160ae86b3", message: `560: ${error.message}` }}).then();
				response.status(560).json({ error: error.message });
			});
	},

	activitySave: (request, response) => {
		if (!request.body.activity) {
			response.status(550).json({ error: "Missing object to save" });
			return;
		}
		
		const save = request.body.activity;

		if (save.id) {
			data.activity.findById(save.id)
				.exec()
				.then(data => {
					if (!data) {
						throw new Error("Record not found");
					}

					Object.keys(save).forEach(field => {
						if (field != "id") {
							data[field] = save[field];
						}
					});
					data.modified = new Date();

					return data.save();
				})
				.then(data => {
					response.status(200).json({ id: data._id });
				})
				.catch(error => {
					client.post(request.logUrl).send({ log: { logTime: new Date(), logTypeId: "64428e0038baa8f160ae86b5", message: `570: ${error.message}` }}).then();
					response.status(570).json({ error: error.message });
				});
		}
		else {
			new data.activity({ ...save, created: new Date(), modified: new Date() })
				.save()
				.then(data => {
					response.status(200).json({ id: data._id });
				})
				.catch(error => {
					client.post(request.logUrl).send({ log: { logTime: new Date(), logTypeId: "64428e0038baa8f160ae86b5", message: `571: ${error.message}` }}).then();
					response.status(571).json({ error: error.message });
				});
		}
	},

	activityDelete: (request, response) => {
		if (!request.query.id || !mongoose.Types.ObjectId.isValid(request.query.id)) {
			response.status(550).json({ error: "Missing ID to delete" });
			return;
		}

		data.activity.deleteOne({ _id: request.query.id })
			.then(() => {
				response.status(200).json({ status: "ok" });
			})
			.catch(error => {
				client.post(request.logUrl).send({ log: { logTime: new Date(), logTypeId: "64428e1238baa8f160ae86b8", message: `560: ${error.message}` }}).then();
				response.status(560).json({ error: error.message });
			});
	}

};