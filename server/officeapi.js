import webRequest from "superagent";

export default {

	commandCenterLoad: (request, response) => {
		webRequest.get(request.protocol + "://" + request.headers.host + "/data/sensorlog" + (request.originalUrl.indexOf("?") > 0 ? request.originalUrl.slice(request.originalUrl.indexOf("?")) : "" ))
			.then(webResponse => {
				const sensorLogs = webResponse.body.sensorLogs
					.map(({ logTime, ...log }) => ({ logTime: new Date(logTime), ...log }))
					.sort((logA, logB) => logB.logTime - logA.logTime);

				const maxLogs = 100,
					totalLogs = sensorLogs.length,
					logInterval = Math.round(totalLogs / maxLogs);

				const output = {
					sensorLogs: sensorLogs.filter((log, logIndex) => logIndex % logInterval === 0)
				};

				return response.status(200).json(output);
			})
			.catch(error => {
				return response.status(560).json({ error: "Error getting sensor logs"});
			})
	},
	
	sensorLogSave: (request, response) => {
		if (!request.body.sensorlog) {
			return response.status(560).json({ error: "Missing object to save" });
		}

		const sensorLogSave = request.body.sensorlog;
		sensorLogSave.logTime = new Date();

		webRequest.post(request.protocol + "://" + request.headers.host + "/data/sensorlog")
			.send({ sensorlog: sensorLogSave })
			.then(webResponse => {
				return response.status(200).json({ id: webRequest.body.id });
			})
			.catch(() => {
				return response.status(561).json({ error: "Error saving sensor log" });
			});

	},

	commandSave: (request, response) => {
		if (!request.body.command) {
			return response.status(560).json({ error: "Missing object to save" });
		}

		const commandSave = request.body.command;
		commandSave.insertTime = new Date();

		webRequest.post(request.protocol + "://" + request.headers.host + "/data/command")
			.send({ command: commandSave })
			.then(webResponse => {
				return response.status(200).json({ id: webResponse.body.id });
			})
			.catch(() => {
				return response.status(561).json({ error: "Error saving command" });
			})

	},

	loadCommands: (request, response) => {
		
		webRequest.get(request.protocol + "://" + request.headers.host + "/data/command")
			.then(webResponse => {
				const output = {
					commands: webResponse.body.commands
				};

				webRequest.delete(request.protocol + "://" + request.headers.host + "/data/command")
					.query("id=all")
					.then(() => {
						return response.status(200).json(output);
					})
					.catch(() => {
						return response.status(561).json({ error: "Error calling delete function" });
					});

			})
			.catch(() => {
				return response.status(560).json({ error: "Error getting commands"});
			})
	}

};
