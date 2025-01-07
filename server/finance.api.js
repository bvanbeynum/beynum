import client from "superagent";
import jwt from "jsonwebtoken";
import config from "./config.js";

export default {

	validate: (request, response) => {
		if (request.query.token) {
			client.get(`${ request.serverPath }/data/user?usertoken=${ request.query.token }`)
				.then(clientResponse => {
					if (clientResponse.body.users && clientResponse.body.users.length === 1) {
						const user = clientResponse.body.users[0];

						let ipAddress = (request.headers["x-forwarded-for"] || "").split(",").pop().trim() || 
							request.connection.remoteAddress || 
							request.socket.remoteAddress || 
							request.connection.socket.remoteAddress;
						ipAddress = ipAddress.match(/[^:][\d.]+$/g).join("");

						user.devices.push({
							lastAccess: new Date(),
							agent: request.headers["user-agent"],
							domain: request.headers.host,
							ip: ipAddress,
							token: request.query.token
						});

						user.tokens = user.tokens.filter(token => token !== request.query.token);

						client.post(`${ request.serverPath }/data/user`)
							.send({ user: user })
							.then(() => {

								const encryptedToken = jwt.sign({ token: request.query.token }, config.jwt);
								response.cookie("by", encryptedToken, { maxAge: 999999999999 });
								response.redirect(request.query.redirect);
								
							})
							.catch(() => {
								response.status(401).send();
							})
					}
					else {
						response.status(401).send();
					}
				})
				.catch(() => {
					response.status(401).send();
				});
		}
		else {
			response.status(401).send();
		}
	},

	hasAccess: (request, response, next) => {
		if (request.user) {
			next();
		}
		else {
			response.status(401).send("Unauthorized");
		}
	},

	load: async (request, response) => {
		const output = {};

		try {
			const clientResponse = await client.get(`${ request.serverPath }/finance/data/transactioncategory`);
			output.categories = clientResponse.body.categories;
		}
		catch (error) {
			client.post(`${ request.serverPath }/sys/api/addlog`).send({ log: { logTime: new Date(), logTypeId: "66de4e2315c583531cb5e70c", message: `562: ${error.message}` }});
			response.statusMessage = error.message;
			response.status(562).json({ location: "Load Transactions", error: error.message });
			return;
		}

		try {
			const clientResponse = await client.get(`${ request.serverPath }/finance/data/transaction?page=1`);
			output.transactions = clientResponse.body.transactions;
		}
		catch (error) {
			client.post(`${ request.serverPath }/sys/api/addlog`).send({ log: { logTime: new Date(), logTypeId: "66de4e2315c583531cb5e70c", message: `561: ${error.message}` }});
			response.statusMessage = error.message;
			response.status(561).json({ location: "Load Transactions", error: error.message });
			return;
		}

		response.status(200).json(output);
	},

	transactionsGet: async (request, response) => {
		const output = {};

		const page = !isNaN(request.query.page) ? parseInt(request.query.page) : 1,
			search = request.query.search ? "&search=" + request.query.search : "",
			category = request.query.category ? "&category=" + request.query.category : "";

		try {
			const clientResponse = await client.get(`${ request.serverPath }/finance/data/transaction?page=${ page }${ search }${ category }`);
			output.transactions = clientResponse.body.transactions;
		}
		catch (error) {
			client.post(`${ request.serverPath }/sys/api/addlog`).send({ log: { logTime: new Date(), logTypeId: "66de4e2315c583531cb5e70c", message: `561: ${error.message}` }});
			response.statusMessage = error.message;
			response.status(561).json({ location: "Load Transactions", error: error.message });
			return;
		}

		response.status(200).json(output);
	},

	transactionSave: async (request, response) => {
		if (!request.body.transaction) {
			response.statusMessage = "Missing Required Data";
			response.status(561).json({ location: "Initialization", error: "Missing Required Data" });
			return;
		}

		const saveTransaction = request.body.transaction;

		let categories = [];
		try {
			const clientResponse = await client.get(`${ request.serverPath }/finance/data/category`);
			categories = clientResponse.body.categories;
		}
		catch (error) {
			client.post(`${ request.serverPath }/sys/api/addlog`).send({ log: { logTime: new Date(), logTypeId: "66de407b15c583531cb5638d", message: `562: ${error.message}` }});
			response.statusMessage = error.message;
			response.status(563).json({ location: "Get Category", error: error.message });
			return;
		}
		
		try {
			if (!categories.includes(saveTransaction.category)) {
				await client.post(`${ request.serverPath }/finance/data/category`).send({ category: { name: saveTransaction.category } }).then();
			}
		}
		catch (error) {
			client.post(`${ request.serverPath }/sys/api/addlog`).send({ log: { logTime: new Date(), logTypeId: "66de407b15c583531cb5638d", message: `562: ${error.message}` }});
			response.statusMessage = error.message;
			response.status(564).json({ location: "Save Transaction Category", error: error.message });
			return;
		}
		
		try {
			const clientResponse = await client.post(`${ request.serverPath }/finance/data/transaction`).send({ transaction: saveTransaction }).then();
			response.status(200).json({ id: clientResponse.body.id });
			return;
		}
		catch (error) {
			client.post(`${ request.serverPath }/sys/api/addlog`).send({ log: { logTime: new Date(), logTypeId: "66de407b15c583531cb5638d", message: `562: ${error.message}` }});
			response.statusMessage = error.message;
			response.status(562).json({ location: "Save Transaction", error: error.message });
			return;
		}
	},

    transactionBulkSave: async (request, response) => {
		if (!request.body.transactions) {
			response.statusMessage = "Missing Required Data";
			response.status(561).json({ location: "Initialization", error: "Missing Required Data" });
			return;
		}

		let transactions = request.body.transactions,
			output = { transactions: [] };
		
		const dateRange = transactions.reduce((output, transaction) => ({
				min: new Date(Math.min(+(new Date(transaction.transactionDate)), output.min)),
				max: new Date(Math.max(+(new Date(transaction.transactionDate)), output.max))
			}), { min: new Date(), max: new Date() });
		
		let existingTransactions = [];
		try {
			const clientResponse = await client.get(`${ request.serverPath }/finance/data/transaction?startDate=${ dateRange.min }&endDate=${ dateRange.max }`);
			existingTransactions = clientResponse.body.transactions;
		}
		catch (error) {
			client.post(`${ request.serverPath }/sys/api/addlog`).send({ log: { logTime: new Date(), logTypeId: "66de407b15c583531cb5638d", message: `562: ${error.message}` }});
			response.statusMessage = error.message;
			response.status(562).json({ location: "Save Transactions", error: error.message });
			return;
		}

		const saveTransactions = transactions.filter(transaction => !existingTransactions.some(existing =>
			+(new Date(transaction.transactionDate)) == +(new Date(existing.transactionDate))
			&& transaction.description == existing.description
			&& transaction.amount == existing.amount
		));

		for (let saveIndex = 0; saveIndex < saveTransactions.length; saveIndex++) {
			// Save each wrestler
			try {
				const clientResponse = await client.post(`${ request.serverPath }/finance/data/transaction`).send({ transaction: saveTransactions[saveIndex] }).then();
				output.transactions.push({ index: saveIndex, id: clientResponse.body.id });
			}
			catch (error) {
				output.transactions.push({ index: saveIndex, error: error.message });
			}
		}

		if (output.transactions.some(transaction => transaction.error)) {
			client.post(`${ request.serverPath }/sys/api/addlog`).send({ log: { logTime: new Date(), logTypeId: "66de407b15c583531cb5638d", message: `563: ${output.transactions.filter(transaction => transaction.error).map(transaction => transaction.error).find(() => true)}` }});
			response.statusMessage = "Error Saving";
			response.status(563).json({ location: "Save Transactions", error: output.transactions.filter(transaction => transaction.error).map(transaction => transaction.error).find(() => true) });
			return;
		}
		else {
			response.status(200).json(output);
		}

    },

	transactionExport: async (request, response) => {
		const output = {};

		const lastYearStart = new Date((new Date()).getFullYear() - 1, 0, 1).toLocaleDateString(),
			today = new Date().toLocaleDateString();
		
		let categories = [],
			transactions = [];

		try {
			const clientResponse = await client.get(`${ request.serverPath }/finance/data/category`);
			categories = clientResponse.body.categories;
		}
		catch (error) {
			client.post(`${ request.serverPath }/sys/api/addlog`).send({ log: { logTime: new Date(), logTypeId: "66de4e2315c583531cb5e70c", message: `561: ${error.message}` }});
			response.statusMessage = error.message;
			response.status(561).json({ location: "Export Transactions", error: error.message });
			return;
		}

		try {
			const clientResponse = await client.get(`${ request.serverPath }/finance/data/transaction?startdate=${ lastYearStart }&enddate=${ today }`);
			transactions = clientResponse.body.transactions;
		}
		catch (error) {
			client.post(`${ request.serverPath }/sys/api/addlog`).send({ log: { logTime: new Date(), logTypeId: "66de4e2315c583531cb5e70c", message: `562: ${error.message}` }});
			response.statusMessage = error.message;
			response.status(562).json({ location: "Load Transactions", error: error.message });
			return;
		}

		try {
			output.transactions = transactions.map(transaction => ({
				...transaction,
				isBudget: categories.filter(category => transaction.category == category.name).map(category => category.isBudget).find(() => true),
				expenseType: categories.filter(category => transaction.category == category.name).map(category => category.expenseType).find(() => true)
			}));
		}
		catch (error) {
			client.post(`${ request.serverPath }/sys/api/addlog`).send({ log: { logTime: new Date(), logTypeId: "66de4e2315c583531cb5e70c", message: `563: ${error.message}` }});
			response.statusMessage = error.message;
			response.status(563).json({ location: "Load Transactions", error: error.message });
			return;
		}

		response.status(200).json(output);
	}

}
