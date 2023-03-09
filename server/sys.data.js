import data from "./sys.schema.js";

export default {

	logTypeGet: (request, response) => {
		let	filter = {},
			select = {};

		if (request.query.id) {
			filter["_id"] = request.query.id;
		}

		data.logType.find(filter)
			.select(select)
			.lean()
			.exec()
			.then(dbs => {
				const objects = dbs.map(({ _id, __v, ...data }) => ({ id: _id, ...data }));
				response.status(200).json({ logTypes: objects });
			})
			.catch(error => {
				response.status(560).json({ error: error.message });
			});
	},

	logTypeSave: (request, response) => {
		if (!request.body.logtype) {
			response.status(550).json({ error: "Missing object to save" });
			return;
		}
		
		const save = request.body.logtype;

		if (save.id) {
			data.logType.findById(save.id)
				.exec()
				.then(db => {
					if (!db) {
						throw new Error("Event not found");
					}

					Object.keys(save).forEach(field => {
						if (field != "id") {
							db[field] = save[field];
						}
					})

					return db.save();
				})
				.then(db => {
					response.status(200).json({ id: db._id });
				})
				.catch(error => {
					response.status(570).json({ error: error.message });
				});
		}
		else {
			new data.logType({ ...save })
				.save()
				.then(db => {
					response.status(200).json({ id: db._id });
				})
				.catch(error => {
					response.status(571).json({ error: error.message });
				});
		}
	},

	logTypeDelete: (request, response) => {
		if (!request.query.id) {
			response.status(550).json({ error: "Missing ID to delete" });
			return;
		}

        data.logType.deleteOne({ _id: request.query.id })
            .then(() => {
                response.status(200).json({ status: "ok" });
            })
            .catch(error => {
                response.status(560).json({ error: error.message });
            });
	},

	logGet: (request, response) => {
		let	filter = {},
			select = {};

		if (request.query.id) {
			filter["_id"] = request.query.id;
		}
        if (request.query.logtype) {
            filter["logType"] = request.query.logtype;
        }

		data.log.find(filter)
			.select(select)
			.lean()
			.exec()
			.then(dbs => {
				const objects = dbs.map(({ _id, __v, ...data }) => ({ id: _id, ...data }));
				response.status(200).json({ logs: objects });
			})
			.catch(error => {
				response.status(560).json({ error: error.message });
			});
	},

	logSave: (request, response) => {
		if (!request.body.log) {
			response.status(550).json({ error: "Missing object to save" });
			return;
		}
		
		const save = request.body.log;

		if (save.id) {
			data.log.findById(save.id)
				.exec()
				.then(db => {
					if (!db) {
						throw new Error("Event not found");
					}

					Object.keys(save).forEach(field => {
						if (field != "id") {
							db[field] = save[field];
						}
					})

					return db.save();
				})
				.then(db => {
					response.status(200).json({ id: db._id });
				})
				.catch(error => {
					response.status(570).json({ error: error.message });
				});
		}
		else {
			new data.log({ ...save })
				.save()
				.then(db => {
					response.status(200).json({ id: db._id });
				})
				.catch(error => {
					response.status(571).json({ error: error.message });
				});
		}
	},

	logDelete: (request, response) => {
		if (!request.query.id) {
			response.status(550).json({ error: "Missing ID to delete" });
			return;
		}

        data.logType.deleteOne({ _id: request.query.id })
            .then(() => {
                response.status(200).json({ status: "ok" });
            })
            .catch(error => {
                response.status(560).json({ error: error.message });
            });
	}

};