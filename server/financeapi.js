import client from "superagent";

const global = {};

global.loadTransactions = (url, callback) => {
	client.get(url)
		.then(clientResponse => {
			callback(null, clientResponse.body.transactions);
		})
		.catch(error => {
			callback(error);
		});
}

export default {

	financeLoad: (request, response) => {
		global.loadTransactions(`${ request.serverPath }/data/transaction`, (error, transactions) => {
			if (error) {
				response.status(560).json({ error: error });
			}
			else {
				response.status(200).json({ transactions: transactions });
			}
		});
	},

	uploadTransactions: (request, response) => {
		const output = {  },
			status = { queued: 0, complete: 0, errors: [] };

		if (request.body.transactions) {
			client.get(`${ request.serverPath }/data/transaction`).then(clientResponse => {
				const allTransactions = clientResponse.body.transactions;

				const newTransactions  = request.body.transactions
					.filter(newTransaction => !allTransactions.some(existing => 
						new Date(newTransaction.date).getTime() == new Date(existing.transactionDate).getTime() &&
						newTransaction.amount == existing.amount &&
						newTransaction.description == existing.description
					))
					.map(newTransaction => ({
						transactionDate: new Date(newTransaction.date),
						amount: newTransaction.amount,
						description: newTransaction.description
					}));

				if (newTransactions.length > 0) {
					status.queued = newTransactions.length;
					newTransactions.forEach(newTransaction => {
						client.post(`${ request.serverPath }/data/transaction`)
							.send({ transaction: newTransaction })
							.then(() => {
								status.complete++;

								if (status.queued === (status.complete + status.errors.length)) {
									output.saved = status.complete;
									output.errors = status.errors;
									
									global.loadTransactions(`${ request.serverPath }/data/transaction`, (error, transactions) => {
										if (error) {
											response.status(563).json({ ...output, error: error });
										}
										else {
											response.status(200).json({ ...output, transactions: transactions });
										}
									});
								}
							})
							.catch(error => {
								status.errors.push(error.message);
								
								if (status.queued === (status.complete + status.errors.length)) {
									output.saved = status.complete;
									output.errors = status.errors;
									
									global.loadTransactions(`${ request.serverPath }/data/transaction`, (error, transactions) => {
										if (error) {
											response.status(563).json({ ...output, error: error });
										}
										else {
											response.status(200).json({ ...output, transactions: transactions });
										}
									});
								}
							});
					});
				}
				else {
					output.saved = 0;
					output.errors = [];
					
					global.loadTransactions(`${ request.serverPath }/data/transaction`, (error, transactions) => {
						if (error) {
							response.status(563).json({ ...output, error: error });
						}
						else {
							response.status(200).json({ ...output, transactions: transactions });
						}
					});
				}
			})
			.catch(error => response.status(562).json({ error: error.message }));
		}
		else {
			response.status(561).json({ error: "Missing transactions to save" })
		}

	}

}