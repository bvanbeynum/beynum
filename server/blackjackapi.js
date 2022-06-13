import client from "superagent";
import jwt from "jsonwebtoken";
import config from "./config.js";
import Engine from "../lib/blackjack.js";

const global = {};

export default {

	authenticate: (request, response, next) => {
		const token = request.cookies.bj ? request.cookies.bj
			: request.headers.authorization && /^bearer [\S]+$/i.test(request.headers.authorization) ? request.headers.authorization.split(" ")[1] 
			: null;

		if (token) {
			try {
				const tokenData = jwt.verify(token, config.jwt);

				if (tokenData.token) {
					client.get(`${ request.serverPath }/bj/data/user?devicetoken=${ tokenData.token }`)
						.then(clientResponse => {
							if (clientResponse.body.users && clientResponse.body.users.length === 1) {
								request.user = clientResponse.body.users[0];
								request.user.devices = request.user.devices.map(device => ({
									...device,
									lastAccess: tokenData.token === device.token ? new Date() : device.lastAccess
								}));

								client.post(`${ request.serverPath }/bj/data/user`)
									.send({ user: request.user })
									.then(() => {})
									.catch(() => {});
								next();
							}
						})
						.catch(() => {
							next();
						});
				}
				else {
					next();
				}
			}
			catch (error) {
				next();
			}
		}
		else {
			next();
		}
	},

	validate: (request, response) => {
		if (request.query.token) {
			client.get(`${ request.serverPath }/bj/data/user?usertoken=${ request.query.token }`)
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

						client.post(`${ request.serverPath }/bj/data/user`)
							.send({ user: user })
							.then(() => {

								const encryptedToken = jwt.sign({ token: request.query.token }, config.jwt);
								response.cookie("bj", encryptedToken, { maxAge: 999999999999 });
								response.redirect("/blackjack.html");
								
							})
							.catch(() => {
								response.redirect("/blackjack.html");
							})
					}
					else {
						response.redirect("/blackjack.html");
					}
				})
				.catch(() => {
					response.redirect("/blackjack.html");
				});
		}
		else {
			response.redirect("/blackjack.html");
		}
	},

	blackJackLoad: (request, response) => {
		if (!request.user) {
			response.status(200).json({ hasAccess: false });
			return;
		}

		const output = { hasAccess: true };

		client.get(`${ request.serverPath }/bj/data/game?userid=${ request.user.id }`)
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
		if (!request.user) {
			response.statusMessage = "Invalid access";
			response.status(560).json({ error: "Invalid access" });
			return;
		}
		if (!request.body.game) {
			response.statusMessage = "Missing object to save";
			response.status(561).json({ error: "Missing object to save" });
			return;
		}

		if (!request.body.game.userId) {
			request.body.game.userId = request.user.id;
		}

		client.post(`${ request.serverPath }/bj/data/game`)
			.send({ game: request.body.game })
			.then(clientResponse => {
				response.status(200).json({ gameid: clientResponse.body.id });
			})
			.catch(error => {
				response.statusMessage = error.message;
				response.status(562).json({ error: errorMessage });
			})
	},

	saveGameTransaction: (request, response) => {
		if (!request.user) {
			response.statusMessage = "Invalid access";
			response.status(560).json({ error: "Invalid access" });
			return;
		}
		if (!request.query.gameid || !request.body.transaction) {
			response.statusMessage = "Missing object to save";
			response.status(561).json({ error: "Missing object to save" });
			return;
		}

		client.get(`${ request.serverPath }/bj/data/game?id=${ request.query.gameid }`)
			.then(clientResponse => {
				const game = clientResponse.body.games[0];
				game.transactions.push(request.body.transaction);
				
				client.post(`${ request.serverPath }/bj/data/game`)
					.send({ game: game })
					.then(clientResponse => {
						response.status(200).json({ id: clientResponse.body.id });
					})
					.catch(error => {
						response.statusMessage = error.message;
						response.status(563).json({ error: error.message });
					});
			})
			.catch(error => {
				response.statusMessage = error.message;
				response.status(562).json({ error: error.message });
			})
	},

	deleteGame: (request, response) => {
		if (!request.user) {
			response.statusMessage = "Invalid access";
			response.status(560).json({ error: "Invalid access" });
			return;
		}
		if (!request.query.gameid){
			response.statusMessage = "Missing object to delete";
			response.status(561).json({ error: "Missing object to delete" });
			return;
		}

		client.delete(`${ request.serverPath }/bj/data/game?id=${ request.query.gameid }`)
			.then(() => {
				const output = {};
				
				client.get(`${ request.serverPath }/bj/data/game`)
					.then(clientResponse => {
						output.games = clientResponse.body.games
							.map(game => ({ ...game, start: new Date(game.start), lastUpdate: new Date(game.lastUpdate) }))
							.sort((gameA, gameB) => gameB.lastUpdate - gameA.lastUpdate)
							.slice(0, 20);
						
						response.status(200).json(output);
					})
					.catch(error => {
						response.statusMessage = error.message;
						response.status(563).json({ error: error.message });
					});
			})
			.catch(error => {
				response.statusMessage = error.message;
				response.status(562).json({ error: error.message });
			})
	},

	gameNew: (request, response) => {
		if (!request.user) {
			response.statusMessage = "Invalid access";
			response.status(560).json({ error: "Invalid access" });
			return;
		}

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
		if (!request.user) {
			response.statusMessage = "Invalid access";
			response.status(560).json({ error: "Invalid access" });
			return;
		}

		if (!request.body.game) {
			response.statusMessage = "Missing existing game state";
			response.status(561).json({ error: "Missing existing game state" });
			return;
		}

		const saveState = request.body.game;

		if (saveState.settings.isPlaying) {
			response.statusMessage = "Game is still in progress";
			response.status(562).json({ error: "Game is still in progress" });
			return;
		}

		if (saveState.settings.bank - saveState.settings.currentBet <= 0) {
			response.statusMessage = "Game is bankrupt";
			response.status(563).json({ error: "Game is bankrupt" });
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
		if (!request.user) {
			response.statusMessage = "Invalid access";
			response.status(560).json({ error: "Invalid access" });
			return;
		}

		if (!request.body.game) {
			response.statusMessage = "Missing existing game state";
			response.status(561).json({ error: "Missing existing game state" });
			return;
		}
		
		if (!request.query.action || !/^(hit|stand|split|double)$/.test(request.query.action)) {
			response.statusMessage = "Invalid action to play";
			response.status(562).json({ error: "Invalid action to play" });
			return;
		}

		const saveState = request.body.game;

		if (!saveState.settings.isPlaying) {
			response.statusMessage = "Game is over";
			response.status(563).json({ error: "Game is over" });
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