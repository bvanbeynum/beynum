import webRequest from "superagent";

export default {

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
					commands: webResponse.body.commands.filter(command => command.status)
				};

				webRequest.delete(request.protocol + "://" + request.headers.host + "/data/command")
				.query("id=all")
				.then(() => {
					response.status(200).json(output);
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
