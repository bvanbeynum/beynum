import data from "./financeschema.js";

export default {

	transactionGet: (request, response) => {
		const filter = {};

		if (request.query.id) {
			filter._id = request.query.id;
		}
		if (request.query.startdate) {
			filter["transactionDate"] = { $gt: new Date(request.query.startdate) };
		}
		if (request.query.enddate) {
			filter["transactionDate"] = { $lt: new Date(request.query.enddate) + (24 * 60 * 60 * 1000) };
		}

		data.transaction.find(filter)
			.lean()
			.exec()
			.then(transactionsDb => {
				const output = {
					transactions: transactionsDb.map(({ _id, __v, ...data }) => ({ id: _id, ...data }))
				};

				response.status(200).json(output);
			})
			.catch(error => {
				response.status(560).json({ error: error.message });
			})
	},

	transactionSave: (request, response) => {
		if (!request.body.transaction) {
			response.status(550).json({ error: "Missing object to save" });
			return;
		}

		const transactionSave = request.body.transaction;

		if (transactionSave.id) {
			data.transaction.findById(transactionSave.id)
				.exec()
				.then(transactionDb => {
					if (!transactionDb) {
						throw new Error("Not found in database");
					}

					Object.keys(transactionSave).forEach(field => {
						if (field != "id") {
							transactionDb[field] = transactionSave[field];
						}
					})

					return transactionDb.save();
				})
				.then(transactionDb => {
					response.status(200).json({ id: transactionDb["_id"] });
				})
				.catch(error => {
					response.status(561).json({ error: error.message });
				});
		}
		else {
			new data.transaction(transactionSave)
				.save()
				.then(transactionDb => {
					response.status(200).json({ id: transactionDb["_id"] });
				})
				.catch(error => {
					response.status(562).json({ error: error.message });
				})
		}
	},

	transactionDelete: (request, response) => {
		if (!request.query.id) {
			response.status(550).json({ error: "Missing ID to delete" });
			return;
		}
		
		data.transaction.deleteOne({ _id: request.query.id })
			.then(() => {
				response.status(200).json({ status: "ok" });
			})
			.catch(error => {
				response.status(560).json({ error: error.message });
			});
	}

};
