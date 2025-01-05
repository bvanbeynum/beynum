import data from "./finance.schema.js";
import client from "superagent";

export default {

	categoryGet: (request, response) => {

		data.transaction.find({category: {$exists: true}})
			.select({ category: 1 })
			.lean()
			.exec()
			.then(transactionsData => {
				const categories = [...new Set(transactionsData.map(transaction => transaction.category))];
				response.status(200).json({ categories: categories });
			})
			.catch(error => {
				client.post(`${ request.serverPath }/sys/api/addlog`).send({ log: { logTime: new Date(), logTypeId: "66de421515c583531cb572c3", message: `560: ${error.message}` }});
				response.status(560).json({ error: error.message });
			});
	},

	transactionGet: (request, response) => {
		let filter = {},
			sort = {},
			top = 0,
			skip = 0;

		if (request.query.id) {
			filter["_id"] = mongoose.Types.ObjectId.isValid(request.query.id) ? request.query.id : null;
		}
		if (request.query.page) {
			const batchSize = 200;
			top = batchSize;
			skip = batchSize * (parseInt(request.query.page) - 1);
			sort = { transactionDate: -1, source: 1, id: 1 };
		}
		if (request.query.search) {
			filter = {
				...filter,
				$or: [
					{ description: { $regex: new RegExp(request.query.search, "i") } },
					{ descriptionOverride: { $regex: new RegExp(request.query.search, "i") } }
				]
			}
		}
		if (request.query.category) {
			filter.category = { $regex: new RegExp("^" + request.query.category + "$", "i")}
		}
		if (request.query.startDate && request.query.endDate) {
			const startDate = new Date(Date.parse(request.query.startDate)),
				endDate = new Date(Date.parse(request.query.endDate));

			filter = {
				$or: [
					{
						$and: [
							{ transactionDate: { $gte: startDate } },
							{ transactionDate: { $lte: endDate } },
						]
					}
				]
			}
		}

		data.transaction.find(filter)
			.sort(sort)
			.skip(skip)
			.limit(top)
			.lean()
			.exec()
			.then(transactionsData => {
				const transactions = transactionsData.map(({ _id, __v, ...transaction }) => ({ id: _id, ...transaction }));
				response.status(200).json({ transactions: transactions });
			})
			.catch(error => {
				client.post(`${ request.serverPath }/sys/api/addlog`).send({ log: { logTime: new Date(), logTypeId: "66de421515c583531cb572c3", message: `560: ${error.message}` }});
				response.status(560).json({ error: error.message });
			});
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
				.then(transactionData => {
					if (!transactionData) {
						throw new Error("Transaction not found");
					}

					Object.keys(transactionSave).forEach(field => {
						if (field != "id") {
							transactionData[field] = transactionSave[field];
						}
					});
					transactionData.modified = new Date();

					return transactionData.save();
				})
				.then(transactionData => {
					response.status(200).json({ id: transactionData._id });
				})
				.catch(error => {
					client.post(`${ request.serverPath }/sys/api/addlog`).send({ log: { logTime: new Date(), logTypeId: "66de439e15c583531cb5821c", message: `570: ${error.message}` }});
					response.status(570).json({ error: error.message });
				});
		}
		else {
			new data.transaction({ ...transactionSave, created: new Date(), modified: new Date() })
				.save()
				.then(transactionData => {
					response.status(200).json({ id: transactionData._id });
				})
				.catch(error => {
					client.post(`${ request.serverPath }/sys/api/addlog`).send({ log: { logTime: new Date(), logTypeId: "66de439e15c583531cb5821c", message: `571: ${error.message}` }});
					response.status(571).json({ error: error.message });
				});
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
				client.post(`${ request.serverPath }/sys/api/addlog`).send({ log: { logTime: new Date(), logTypeId: "66de43f715c583531cb58546", message: `560: ${error.message}` }});
				response.status(560).json({ error: error.message });
			});
	}

}