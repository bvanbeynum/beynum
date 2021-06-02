import data from "./officeschema.js";

export default {

	// ******************** Sensor ************************

	sensorLogGet: (request, response) => {
		const filter = {};

		if (request.query.timespan) {
			switch (request.query.timespan) {
			case "day":
				filter.logTime = { $gt: new Date(Date.now() - 24 * 60 * 60 * 1000) }
				break;

			case "week":
				filter.logTime = { $gt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
				break;
			
			case "month":
				filter.logTime = { $gt: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000) }
				break;
			}
		}

		data.sensorLog.find(filter)
			.lean()
			.exec()
			.then(sensorLogsDB => {
				const output = {
					sensorLogs: sensorLogsDB.map(({ _id, __v, ...sensorLog}) => ({ id: _id, ...sensorLog }))
				};

				response.status(200).json(output);
			})
			.catch(error => {
				response.status(560).json({ error : error.message });
			})
	},

	sensorLogSave: (request, response) => {
		if (!request.body.sensorlog) {
			return response.status(560).json({ error: "Missing object to save" });
		}

		const sensorLogSave = request.body.sensorlog;

		if (sensorLogSave.id) {
			data.sensorLog.findById(sensorLogSave.id)
				.exec()
				.then(sensorLogDB => {
					if (!sensorLogDB) {
						throw new Error("Sensor log not found");
					}

					Object.keys(sensorLogSave).forEach(field => {
						if (field != "id") {
							sensorLogDB[field] = sensorLogSave[field];
						}
					})

					return sensorLogDB.save();
				})
				.then(sensorLogDB => {
					response.status(200).json({ id: sensorLogDB._id });
				})
				.catch(error => {
					response.status(561).json({ error: error.message });
				})
		}
		else {
			new data.sensorLog({ ...sensorLogSave })
				.save()
				.then(sensorLogDB => {
					response.status(200).json({ id: sensorLogDB._id });
				})
				.catch(error => {
					response.status(561).json({ error: error.message });
				})
		}
	},

	sensorLogDelete: (request, response) => {
		if (!request.query.id) {
			return response.status(560).json({ error: "Missing ID to delete" });
		}

		data.sensorLog.deleteOne({ _id: parseInt(request.query.id) })
			.then(() => {
				response.status(200).json({ status: "ok" });
			})
			.catch(error => {
				response.status(561).json({ error: error.message });
			});
	},
	
	// ******************** Command ************************
	
	commandGet: (request, response) => {
		data.command.find()
			.lean()
			.exec()
			.then(commandsDB => {
				const output = {
					commands: commandsDB.map(({ _id, __v, ...command}) => ({ id: _id, ...command }))
				};

				response.status(200).json(output);
			})
			.catch(error => {
				response.status(560).json({ error : error.message });
			})
	},

	commandSave: (request, response) => {
		if (!request.body.command) {
			return response.status(560).json({ error: "Missing object to save" });
		}

		const commandSave = request.body.command;

		if (commandSave.id) {
			data.command.findById(commandSave.id)
				.exec()
				.then(commandDB => {
					if (!commandDB) {
						throw new Error("Record not found");
					}

					Object.keys(commandSave).forEach(field => {
						if (field != "id") {
							commandDB[field] = commandSave[field];
						}
					})

					return commandDB.save();
				})
				.then(commandDB => {
					response.status(200).json({ id: commandDB._id });
				})
				.catch(error => {
					response.status(561).json({ error: error.message });
				})
		}
		else {
			new data.command({ ...commandSave })
				.save()
				.then(commandDB => {
					response.status(200).json({ id: commandDB._id });
				})
				.catch(error => {
					response.status(561).json({ error: error.message });
				})
		}
	},
	
	commandDelete: (request, response) => {
		if (!request.query.id) {
			return response.status(560).json({ error: "Missing ID to delete" });
		}

		if (request.query.id === "all") {
			data.command
				.deleteMany({})
				.exec()
				.then(() => {
					response.status(200).json({ status: "ok" });
				})
				.catch(error => {
					response.status(561).json({ error: error.message });
				});
				
		}
		else {
			data.command.deleteOne({ _id: parseInt(request.query.id) })
				.then(() => {
					response.status(200).json({ status: "ok" });
				})
				.catch(error => {
					response.status(561).json({ error: error.message });
				});
		}
	}
	
};