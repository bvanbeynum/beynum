import client from "superagent";

const global = {};

export default {

	blackJackLoad: (request, response) => {
		const output = {};

		client.get(`${ request.serverPath }/data/game`)
			.then(clientResponse => {
				output.games = clientResponse.body.games
				.map(game => ({ ...game, start: new Date(game.start), lastUpdate: new Date(game.lastUpdate) }))
				.sort((gameA, gameB) => gameB.lastUpdate - gameA.lastUpdate)
				.slice(0, 20);
				
				response.status(200).json(output);
			})
			.catch(error => {
				response.statusMessage = error.message;
				response.status(561).json({ error: error.message });
			});
	},

	saveGame: (request, response) => {
		if (!request.body.game) {
			response.statusMessage = "Missing object to save";
			response.status(560).json({ error: "Missing object to save" });
			return;
		}

		client.post(`${ request.serverPath }/data/game`)
			.send({ game: request.body.game })
			.then(clientResponse => {
				response.status(200).json({ gameid: clientResponse.body.id });
			})
			.catch(error => {
				response.statusMessage = error.message;
				response.status(561).json({ error: errorMessage });
			})
	},

	saveGameHand: (request, response) => {
		if (!request.query.gameid || !request.body.gamehand) {
			response.statusMessage = "Missing object to save";
			response.status(560).json({ error: "Missing object to save" });
			return;
		}

		client.get(`${ request.serverPath }/data/game?id=${ request.query.gameid }`)
			.then(clientResponse => {
				const game = clientResponse.body.games[0];
				game.hands.push(request.body.gamehand);
				
				client.post(`${ request.serverPath }/data/game`)
					.send({ game: game })
					.then(clientResponse => {
						response.status(200).json({ id: clientResponse.body.id });
					})
					.catch(error => {
						response.statusMessage = error.message;
						response.status(562).json({ error: error.message });
					});
			})
			.catch(error => {
				response.statusMessage = error.message;
				response.status(561).json({ error: error.message });
			})
	},

	deleteGame: (request, response) => {
		if (!request.query.gameid){
			response.statusMessage = "Missing object to delete";
			response.status(560).json({ error: "Missing object to delete" });
			return;
		}

		client.delete(`${ request.serverPath }/data/game?id=${ request.query.gameid }`)
			.then(() => {
				const output = {};
				
				client.get(`${ request.serverPath }/data/game`)
					.then(clientResponse => {
						output.games = clientResponse.body.games
							.map(game => ({ ...game, start: new Date(game.start), lastUpdate: new Date(game.lastUpdate) }))
							.sort((gameA, gameB) => gameB.lastUpdate - gameA.lastUpdate)
							.slice(0, 20);
						
						response.status(200).json(output);
					})
					.catch(error => {
						response.statusMessage = error.message;
						response.status(562).json({ error: error.message });
					});
			})
			.catch(error => {
				response.statusMessage = error.message;
				response.status(561).json({ error: error.message });
			})
	}

}