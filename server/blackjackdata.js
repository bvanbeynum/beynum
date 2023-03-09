import data from "./blackjackschema.js";

export default {

	userGet: (request, response) => {
		const filter = {};

		if (request.query.id) {
			filter["_id"] = request.query.id
		}
		if (request.query.usertoken) {
			filter["tokens"] = request.query.usertoken
		}
		if (request.query.devicetoken) {
			filter["devices.token"] = request.query.devicetoken
		}
		if (request.query.email) {
			filter["email"] = request.query.email;
		}

		data.user.find(filter)
			.lean()
			.exec()
			.then(usersData => {
				const users = usersData.map(({ _id, __v, ...user }) => ({ id: _id, ...user }));
				response.status(200).json({ users: users });
			})
			.catch(error => {
				client.post(`${ request.serverPath }/sys/api/addlog`).send({ log: { logTime: new Date(), logTypeId: "6409df67a94a664c619ef501", message: `560: ${error.message}` }});
				response.status(560).json({ error: error.message });
			});
	},

	userSave: (request, response) => {
		if (!request.body.user) {
			response.status(550).json({ error: "Missing object to save" });
			return;
		}
		
		const userSave = request.body.user;

		if (userSave.id) {
			data.user.findById(userSave.id)
				.exec()
				.then(userData => {
					if (!userData) {
						throw new Error("User not found");
					}

					Object.keys(userSave).forEach(field => {
						if (field != "id") {
							userData[field] = userSave[field];
						}
					});

					return userData.save();
				})
				.then(userData => {
					response.status(200).json({ id: userData._id });
				})
				.catch(error => {
					client.post(`${ request.serverPath }/sys/api/addlog`).send({ log: { logTime: new Date(), logTypeId: "6409df8da94a664c619ef503", message: `570: ${error.message}` }});
					response.status(570).json({ error: error.message });
				});
		}
		else {
			new data.user({ ...userSave })
				.save()
				.then(userData => {
					response.status(200).json({ id: userData._id });
				})
				.catch(error => {
					client.post(`${ request.serverPath }/sys/api/addlog`).send({ log: { logTime: new Date(), logTypeId: "6409df8da94a664c619ef503", message: `571: ${error.message}` }});
					response.status(571).json({ error: error.message });
				});
		}
	},

	userDelete: (request, response) => {
		if (!request.query.id) {
			response.status(550).json({ error: "Missing ID to delete" });
			return;
		}

		data.user.deleteOne({ _id: request.query.id })
			.then(() => {
				response.status(200).json({ status: "ok" });
			})
			.catch(error => {
				client.post(`${ request.serverPath }/sys/api/addlog`).send({ log: { logTime: new Date(), logTypeId: "6409dfb9a94a664c619ef505", message: `560: ${error.message}` }});
				response.status(560).json({ error: error.message });
			});
	},

	gameGet: (request, response) => {
		const filter = {};

		if (request.query.id) {
			filter._id = request.query.id;
		}
		if (request.query.userid) {
			filter.userId = request.query.userid;
		}

		data.game.find(filter)
			.lean()
			.exec()
			.then(gamesDb => {
				const output = {
					games: gamesDb.map(({ _id, __v, ...data }) => ({ id: _id, ...data }))
				};

				response.status(200).json(output);
			})
			.catch(error => {
				client.post(`${ request.serverPath }/sys/api/addlog`).send({ log: { logTime: new Date(), logTypeId: "6409dfd7a94a664c619ef507", message: `560: ${error.message}` }});
				response.status(560).json({ error: error.message });
			});
	},

	gameSave: (request, response) => {
		if (!request.body.game) {
			response.status(550).json({ error: "Missing object to save" });
			return;
		}

		const gameSave = request.body.game;
		gameSave.lastUpdate = new Date();

		if (gameSave.id) {
			data.game.findById(gameSave.id)
				.exec()
				.then(gameDb => {
					if (!gameDb) {
						throw new Error("Not found in database");
					}

					Object.keys(gameSave).forEach(field => {
						if (field != "id") {
							gameDb[field] = gameSave[field];
						}
					});

					return gameDb.save();
				})
				.then(gameDb => {
					response.status(200).json({ id: gameDb["_id"] });
				})
				.catch(error => {
					client.post(`${ request.serverPath }/sys/api/addlog`).send({ log: { logTime: new Date(), logTypeId: "6409dff7a94a664c619ef509", message: `561: ${error.message}` }});
					response.status(561).json({ error: error.message });
				});
		}
		else {
			new data.game(gameSave)
				.save()
				.then(gameDb => {
					response.status(200).json({ id: gameDb["_id"] });
				})
				.catch(error => {
					client.post(`${ request.serverPath }/sys/api/addlog`).send({ log: { logTime: new Date(), logTypeId: "6409dff7a94a664c619ef509", message: `562: ${error.message}` }});
					response.status(562).json({ error: error.message });
				})
		}
	},

	gameDelete: (request, response) => {
		if (!request.query.id) {
			response.status(550).json({ error: "Missing ID to delete" });
			return;
		}
		
		data.game.deleteOne({ _id: request.query.id })
			.then(() => {
				response.status(200).json({ status: "ok" });
			})
			.catch(error => {
				client.post(`${ request.serverPath }/sys/api/addlog`).send({ log: { logTime: new Date(), logTypeId: "6409e016a94a664c619ef50b", message: `560: ${error.message}` }});
				response.status(560).json({ error: error.message });
			});
	},

	gameStateGet: (request, response) => {
		const filter = {};

		if (request.query.id) {
			filter._id = request.query.id;
		}

		data.gameState.find(filter)
			.lean()
			.exec()
			.then(gameStatesDb => {
				const output = {
					gameStates: gameStatesDb.map(({ _id, __v, ...data }) => ({ id: _id, ...data }))
				};

				response.status(200).json(output);
			})
			.catch(error => {
				client.post(`${ request.serverPath }/sys/api/addlog`).send({ log: { logTime: new Date(), logTypeId: "6409e037a94a664c619ef50d", message: `560: ${error.message}` }});
				response.status(560).json({ error: error.message });
			});
	},

	gameStateSave: (request, response) => {
		if (!request.body.gamestate) {
			response.status(550).json({ error: "Missing object to save" });
			return;
		}

		const gameStateSave = request.body.gamestate;

		if (gameStateSave.id) {
			data.gameState.findById(gameStateSave.id)
				.exec()
				.then(gameStateDb => {
					if (!gameStateDb) {
						throw new Error("Not found in database");
					}

					Object.keys(gameStateSave).forEach(field => {
						if (field != "id") {
							gameStateDb[field] = gameStateSave[field];
						}
					});

					return gameStateDb.save();
				})
				.then(gameStateDb => {
					response.status(200).json({ id: gameStateDb["_id"] });
				})
				.catch(error => {
					client.post(`${ request.serverPath }/sys/api/addlog`).send({ log: { logTime: new Date(), logTypeId: "6409e054a94a664c619ef50f", message: `561: ${error.message}` }});
					response.status(561).json({ error: error.message });
				});
		}
		else {
			new data.gameState(gameStateSave)
				.save()
				.then(gameStateDb => {
					response.status(200).json({ id: gameStateDb["_id"] });
				})
				.catch(error => {
					client.post(`${ request.serverPath }/sys/api/addlog`).send({ log: { logTime: new Date(), logTypeId: "6409e054a94a664c619ef50f", message: `562: ${error.message}` }});
					response.status(562).json({ error: error.message });
				})
		}
	},

	gameStateDelete: (request, response) => {
		if (!request.query.id) {
			response.status(550).json({ error: "Missing ID to delete" });
			return;
		}
		
		data.gameState.deleteOne({ _id: request.query.id })
			.then(() => {
				response.status(200).json({ status: "ok" });
			})
			.catch(error => {
				client.post(`${ request.serverPath }/sys/api/addlog`).send({ log: { logTime: new Date(), logTypeId: "6409e078a94a664c619ef511", message: `560: ${error.message}` }});
				response.status(560).json({ error: error.message });
			});
	}

};
