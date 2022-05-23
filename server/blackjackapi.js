import client from "superagent";

const global = {};

export default {

	blackJackLoad: (request, response) => {
		const output = {};

		client.get(`${ request.serverPath }/data/game`)
			.then(clientResponse => {
				output.games = clientResponse.body.games
					.map(game => ({ ...game, start: new Date(game.start), end: game.end ? new Date(game.end) : null }))
					.sort((gameA, gameB) => gameB.start - gameA.start)
					.slice(0, 20);
				
				response.status(200).json(output);
			})
			.catch(error => {
				response.statusMessage = error.message;
				response.status(561).json({ error: error.message });
			});
	},

	blackJackSave: (request, response) => {
		if (!request.body.game) {
			response.statusMessage = "Missing object to save";
			response.status(560).json({ error: "Missing object to save" });
			return;
		}

		client.post(`${ request.serverPath }/data/game`)
			.send({ game: request.body.game })
			.then(clientResponse => {
				response.status(200).json({ id: clientResponse.body.id });
			})
			.catch(error => {
				response.statusMessage = error.message;
				response.status(561).json({ error: error.message });
			})
	}

}