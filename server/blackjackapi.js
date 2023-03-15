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
								request.device = (({ _id, ...device }) => ({ ...device, id: _id }))(request.user.devices.find(device => device.token === tokenData.token));
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
							.catch(error => {
								client.post(`${ request.serverPath }/sys/api/addlog`).send({ log: { logTime: new Date(), logTypeId: "6409dc835edbeb52004eb549", message: `560: ${error.message}` }});
								response.redirect("/blackjack.html");
							})
					}
					else {
						response.redirect("/blackjack.html");
					}
				})
				.catch(() => {
					client.post(`${ request.serverPath }/sys/api/addlog`).send({ log: { logTime: new Date(), logTypeId: "6409dc835edbeb52004eb549", message: `561: ${error.message}` }});
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
				client.post(`${ request.serverPath }/sys/api/addlog`).send({ log: { logTime: new Date(), logTypeId: "6409ddf45edbeb52004eb54c", message: `561: ${error.message}` }});
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
		if (!request.body.game.deviceId) {
			request.body.game.deviceId = request.device.id;
		}

		client.post(`${ request.serverPath }/bj/data/game`)
			.send({ game: request.body.game })
			.then(clientResponse => {
				response.status(200).json({ gameid: clientResponse.body.id });
			})
			.catch(error => {
				client.post(`${ request.serverPath }/sys/api/addlog`).send({ log: { logTime: new Date(), logTypeId: "6409de2f5edbeb52004eb54e", message: `562: ${error.message}` }});
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
						client.post(`${ request.serverPath }/sys/api/addlog`).send({ log: { logTime: new Date(), logTypeId: "6409de5d5edbeb52004eb550", message: `563: ${error.message}` }});
						response.statusMessage = error.message;
						response.status(563).json({ error: error.message });
					});
			})
			.catch(error => {
				client.post(`${ request.serverPath }/sys/api/addlog`).send({ log: { logTime: new Date(), logTypeId: "6409de5d5edbeb52004eb550", message: `562: ${error.message}` }});
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
						client.post(`${ request.serverPath }/sys/api/addlog`).send({ log: { logTime: new Date(), logTypeId: "6409de865edbeb52004eb552", message: `563: ${error.message}` }});
						response.statusMessage = error.message;
						response.status(563).json({ error: error.message });
					});
			})
			.catch(error => {
				client.post(`${ request.serverPath }/sys/api/addlog`).send({ log: { logTime: new Date(), logTypeId: "6409de865edbeb52004eb552", message: `562: ${error.message}` }});
				response.statusMessage = error.message;
				response.status(562).json({ error: error.message });
			})
	},

	gameNew: async (request, response) => {
		if (!request.user) {
			response.statusMessage = "Invalid access";
			response.status(560).json({ error: "Invalid access" });
			return;
		}

		const engine = new Engine({
			settings: {
				blackjackPayout: 1.2,
				currentBet: +request.query.bet && request.query.bet > 0 ? +request.query.bet : 10
			}
		});
		const saveState = {
			hands: engine.Hands,
			settings: {
				...engine.Settings,
				startTime: new Date(),
				lastUpdate: new Date()
			},
			transactions: engine.Transactions,
			deck: engine.Deck
		};

		let clientResponse = null;
		try {
			clientResponse = await client.post(`${ request.serverPath }/bj/data/gamestate`).send({ gamestate: saveState });
		}
		catch (error) {
			client.post(`${ request.serverPath }/sys/api/addlog`).send({ log: { logTime: new Date(), logTypeId: "6409dec55edbeb52004eb554", message: `561: ${error.message}` }});
			response.status(561).json({ error: error.response && error.response.body ? error.response.body.error : error.message });
			return;
		}

		const output = {
			id: clientResponse.body.id,
			hands: {
				player: {},
				split: null,
				dealer: {}
			},
			settings: engine.Settings,
			strategy: (({ display, selectedIndex }) => ({ display, selectedIndex }))(engine.Strategy),
			transactions: engine.Transactions
		};

		try {
			clientResponse = await client.get(`${ request.serverPath }/bj/data/gamestate`);

			let today = new Date();
			today.setHours(0,0,0,0);

			const oldGames = clientResponse.body.gameStates.filter(gameState => !gameState.settings.lastUpdate || gameState.settings.lastUpdate < today);
			oldGames.forEach(gameState => client.delete(`${ request.serverPath }/bj/data/gamestate?id=${ gameState.id }`));
		}
		catch {}

		response.status(200).json(output);
	},

	gameDeal: async (request, response) => {
		if (!request.user) {
			response.statusMessage = "Invalid access";
			response.status(560).json({ error: "Invalid access" });
			return;
		}

		if (!request.query.state) {
			response.statusMessage = "Missing existing game state";
			response.status(561).json({ error: "Missing existing game state" });
			return;
		}

		let clientResponse = null;
		try {
			clientResponse = await client.get(`${ request.serverPath }/bj/data/gamestate?id=${ request.query.state }`)
		}
		catch (error) {
			client.post(`${ request.serverPath }/sys/api/addlog`).send({ log: { logTime: new Date(), logTypeId: "6409deeb5edbeb52004eb556", message: `562: ${error.message}` }});
			response.status(562).json({ error: error.response && error.response.body ? error.response.body.error : error.message });
		}

		const saveState = clientResponse.body.gameStates[0];
		const engine = new Engine(saveState);

		if (engine.Settings.isPlaying) {
			response.statusMessage = "Game is still in progress";
			response.status(563).json({ error: "Game is still in progress" });
			return;
		}

		if (engine.Settings.bank - engine.Settings.currentBet <= 0) {
			response.statusMessage = "Game is bankrupt";
			response.status(564).json({ error: "Game is bankrupt" });
			return;
		}

		if (+request.query.bet && request.query.bet > 0 && request.query.bet != engine.Settings.currentBet) {
			engine.Settings.currentBet = +request.query.bet;
		}

		engine.Deal();

		saveState.hands = engine.Hands;
		saveState.settings = {
			...engine.Settings,
			lastUpdate: new Date()
		};
		saveState.transactions = engine.Transactions;
		saveState.deck = engine.Deck;

		try {
			clientResponse = await client.post(`${ request.serverPath }/bj/data/gamestate`)
				.send({ gamestate: saveState });
		}
		catch (error) {
			client.post(`${ request.serverPath }/sys/api/addlog`).send({ log: { logTime: new Date(), logTypeId: "6409deeb5edbeb52004eb556", message: `565: ${error.message}` }});
			response.status(565).json({ error: error.response && error.response.body ? error.response.body.error : error.message });
			return;
		}
		
		const output = {
			id: saveState.id,
			hands: {
				player: engine.Hands.player,
				split: engine.Hands.split,
				dealer: engine.Settings.isPlaying ? { cards: [ engine.Hands.dealer.cards[1] ], value: null } : engine.Hands.dealer
			},
			settings: engine.Settings,
			strategy: (({ display, selectedIndex }) => ({ display, selectedIndex }))(engine.Strategy),
			transactions: engine.Transactions
		};

		response.status(200).json(output);
	},

	gamePlay: async (request, response) => {
		if (!request.user) {
			response.statusMessage = "Invalid access";
			response.status(560).json({ error: "Invalid access" });
			return;
		}

		if (!request.query.state) {
			response.statusMessage = "Missing existing game state";
			response.status(561).json({ error: "Missing existing game state" });
			return;
		}
		
		if (!request.query.action || !/^(hit|stand|split|double)$/i.test(request.query.action)) {
			response.statusMessage = "Invalid action to play";
			response.status(562).json({ error: "Invalid action to play" });
			return;
		}

		let clientResponse = null;
		try {
			clientResponse = await client.get(`${ request.serverPath }/bj/data/gamestate?id=${ request.query.state }`);
		}
		catch (error) {
			client.post(`${ request.serverPath }/sys/api/addlog`).send({ log: { logTime: new Date(), logTypeId: "6409df275edbeb52004eb558", message: `563: ${error.message}` }});
			response.status(563).json({ error: error.response && error.response.body ? error.response.body.error : error.message });
			return;
		}

		const saveState = clientResponse.body.gameStates[0];
		const engine = new Engine(saveState);
		
		if (!engine.Settings.isPlaying) {
			response.statusMessage = "Game is over";
			response.status(564).json({ error: "Game is over" });
			return;
		}
		
		engine.Play(request.query.action.toLowerCase());
		
		saveState.hands = engine.Hands;
		saveState.settings = {
			...engine.Settings,
			lastUpdate: new Date()
		};
		saveState.transactions = engine.Transactions;
		saveState.deck = engine.Deck;

		try {
			clientResponse = await client.post(`${ request.serverPath }/bj/data/gamestate`)
				.send({ gamestate: saveState });
		}
		catch (error) {
			client.post(`${ request.serverPath }/sys/api/addlog`).send({ log: { logTime: new Date(), logTypeId: "6409df275edbeb52004eb558", message: `565: ${error.message}` }});
			response.status(565).json({ error: error.response && error.response.body ? error.response.body.error : error.message });
			return;
		}
		
		const output = {
			id: saveState.id,
			hands: {
				player: engine.Hands.player,
				split: engine.Hands.split,
				dealer: engine.Settings.isPlaying ? { cards: [ engine.Hands.dealer.cards[1] ], value: null } : engine.Hands.dealer
			},
			settings: engine.Settings,
			strategy: (({ display, selectedIndex }) => ({ display, selectedIndex }))(engine.Strategy),
			transactions: engine.Transactions
		};

		response.status(200).json(output);
	}

}