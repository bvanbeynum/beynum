import data from "./blackjackschema.js";

export default {

	gameGet: (request, response) => {
		const filter = {};

		if (request.query.id) {
			filter._id = request.query.id;
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
					})

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
