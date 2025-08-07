import data from "./sys.schema.js";
import client from "superagent";

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
	},

	jobGet: (request, response) => {
		const filter = {};

		if (request.query.id) {
			filter["_id"] = request.query.id
		}

		data.job.find(filter)
			.lean()
			.exec()
			.then(records => {
				const output = { jobs: records.map(({ _id, __v, ...data }) => ({ id: _id, ...data })) };
				response.status(200).json(output);
			})
			.catch(error => {
				client.post(`${ request.serverPath }/sys/api/addlog`).send({ log: { logTime: new Date(), logTypeId: "640b4e4f743f6b08b4402957", message: `560: ${error.message}` }});
				response.status(560).json({ error: error.message });
			});
	},

	jobSave: (request, response) => {
		if (!request.body.job) {
			response.status(550).json({ error: "Missing object to save" });
			return;
		}
		
		const save = request.body.job;
		console.log(`${ (new Date()).toLocaleString() }: SaveJob - Job: ${ save.id }`)

		if (save.id) {
			data.job.findById(save.id)
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
					client.post(`${ request.serverPath }/sys/api/addlog`).send({ log: { logTime: new Date(), logTypeId: "640b4e69743f6b08b4402959", message: `570: ${error.message}` }});
					response.status(570).json({ error: error.message });
				});
		}
		else {
			new data.job({ ...save, created: new Date(), modified: new Date() })
				.save()
				.then(data => {
					response.status(200).json({ id: data._id });
				})
				.catch(error => {
					client.post(`${ request.serverPath }/sys/api/addlog`).send({ log: { logTime: new Date(), logTypeId: "640b4e69743f6b08b4402959", message: `571: ${error.message}` }});
					response.status(571).json({ error: error.message });
				});
		}
	},

	jobDelete: (request, response) => {
		if (!request.query.id) {
			response.status(550).json({ error: "Missing ID to delete" });
			return;
		}

		data.job.deleteOne({ _id: request.query.id })
			.then(() => {
				response.status(200).json({ status: "ok" });
			})
			.catch(error => {
				client.post(`${ request.serverPath }/sys/api/addlog`).send({ log: { logTime: new Date(), logTypeId: "640b4e90743f6b08b440295b", message: `560: ${error.message}` }});
				response.status(560).json({ error: error.message });
			});
	},

	urlStatusGet: (request, response) => {
		const filter = {};

		if (request.query.id) {
			filter["_id"] = request.query.id
		}

		data.urlStatus.find(filter)
			.lean()
			.exec()
			.then(records => {
				const output = { urlStatusList: records.map(({ _id, __v, ...data }) => ({ id: _id, ...data })) };
				response.status(200).json(output);
			})
			.catch(error => {
				client.post(`${ request.serverPath }/sys/api/addlog`).send({ log: { logTime: new Date(), logTypeId: "640b5a2511ba6e2962e58baf", message: `560: ${error.message}` }});
				response.status(560).json({ error: error.message });
			});
	},

	urlStatusSave: (request, response) => {
		if (!request.body.urlstatus) {
			response.status(550).json({ error: "Missing object to save" });
			return;
		}
		
		const save = request.body.urlstatus;

		if (save.id) {
			data.urlStatus.findById(save.id)
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
					client.post(`${ request.serverPath }/sys/api/addlog`).send({ log: { logTime: new Date(), logTypeId: "640b5a3d11ba6e2962e58bb2", message: `570: ${error.message}` }});
					response.status(570).json({ error: error.message });
				});
		}
		else {
			new data.urlStatus({ ...save, created: new Date(), modified: new Date() })
				.save()
				.then(data => {
					response.status(200).json({ id: data._id });
				})
				.catch(error => {
					client.post(`${ request.serverPath }/sys/api/addlog`).send({ log: { logTime: new Date(), logTypeId: "640b5a3d11ba6e2962e58bb2", message: `571: ${error.message}` }});
					response.status(571).json({ error: error.message });
				});
		}
	},

	urlStatusDelete: (request, response) => {
		if (!request.query.id) {
			response.status(550).json({ error: "Missing ID to delete" });
			return;
		}

		data.urlStatus.deleteOne({ _id: request.query.id })
			.then(() => {
				response.status(200).json({ status: "ok" });
			})
			.catch(error => {
				client.post(`${ request.serverPath }/sys/api/addlog`).send({ log: { logTime: new Date(), logTypeId: "640b5a9e11ba6e2962e58bb5", message: `560: ${error.message}` }});
				response.status(560).json({ error: error.message });
			});
	}

};