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
					})

					return userData.save();
				})
				.then(userData => {
					response.status(200).json({ id: userData._id });
				})
				.catch(error => {
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
					response.status(571).json({ error: error.message });
				})
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
				response.status(560).json({ error: error.message });
			})
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
				response.status(560).json({ error: error.message });
			});
	}

};
