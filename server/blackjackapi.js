import client from "superagent";
import Engine from "../lib/blackjack.js";

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
	},

	gameNew: (request, response) => {
		const engine = new Engine();

		const output = {
			hands: engine.Hands,
			strategy: (({ display, selectedIndex }) => ({ display, selectedIndex }))(engine.Strategy),
			settings: engine.Settings,
			transactions: engine.Transactions,
			deck: engine.Deck
		};

		response.status(200).json(output);
	},

	gameDeal: (request, response) => {
		if (!request.body.game) {
			response.statusMessage = "Missing existing game state";
			response.status(560).json({ error: "Missing existing game state" });
			return;
		}

		const saveState = request.body.game;

		if (saveState.settings.isPlaying) {
			response.statusMessage = "Game is still in progress";
			response.status(561).json({ error: "Game is still in progress" });
			return;
		}

		if (saveState.settings.bank - saveState.settings.currentBet <= 0) {
			response.statusMessage = "Game is bankrupt";
			response.status(562).json({ error: "Game is bankrupt" });
			return;
		}

		const engine = new Engine(null, request.body.game);
		engine.Deal();

		const output = {
			hands: engine.Hands,
			strategy: (({ display, selectedIndex }) => ({ display, selectedIndex }))(engine.Strategy),
			settings: engine.Settings,
			transactions: engine.Transactions,
			deck: engine.Deck
		};

		response.status(200).json(output);
	},

	gamePlay: (request, response) => {
		if (!request.body.game) {
			response.statusMessage = "Missing existing game state";
			response.status(560).json({ error: "Missing existing game state" });
			return;
		}
		
		if (!request.query.action || !/^(hit|stand|split|double)$/.test(request.query.action)) {
			response.statusMessage = "Invalid action to play";
			response.status(560).json({ error: "Invalid action to play" });
			return;
		}

		const saveState = request.body.game;

		if (!saveState.settings.isPlaying) {
			response.statusMessage = "Game is over";
			response.status(561).json({ error: "Game is over" });
			return;
		}

		const engine = new Engine(null, request.body.game);
		engine.Play(request.query.action);

		const output = {
			hands: engine.Hands,
			strategy: (({ display, selectedIndex }) => ({ display, selectedIndex }))(engine.Strategy),
			settings: engine.Settings,
			transactions: engine.Transactions,
			deck: engine.Deck
		};

		response.status(200).json(output);
	}

}