import webRequest from "request";

export default {

	sensorLogSave: (request, response) => {
		if (!request.body.sensorlog) {
			return response.status(560).json({ error: "Missing object to save" });
		}

		const sensorLogSave = request.body.sensorlog;

		webRequest.post({ 
			url: request.protocol + "://" + request.headers.host + "/data/sensorlog",
			form: { sensorlog: sensorLogSave },
			json: true
		}, (error, webResponse, webBody) => {
			if (error) {
				return response.status(561).json({ error: error.message });
			}

			response.status(200).json({ id: webBody.id });
		})
	},

	commandSave: (request, response) => {
		if (!request.body.command) {
			return response.status(560).json({ error: "Missing object to save" });
		}

		const commandSave = request.body.command;

		webRequest.post({ 
			url: request.protocol + "://" + request.headers.host + "/data/command",
			form: { command: commandSave },
			json: true
		}, (error, webResponse, webBody) => {
			if (error) {
				return response.status(561).json({ error: error.message });
			}

			response.status(200).json({ id: webBody.id });
		});
	},

	loadCommands: (request, response) => {
		webRequest.get({ url: request.protocol + "://" + request.headers.host + "/data/command", json: true }, (error, webResponse, webBody) => {
			if (error) {
				return response.status(560).json({ error: error.message });
			}

			const output = {
				commands: webBody.commands.filter(command => command.status)
			};

			webRequest.delete({ url: request.protocol + "://" + request.headers.host + "/data/command?id=all", json: true }, (error, webResponse, webBody) => {
				if (error) {
					return response.status(561).json({ error: error.message });
				}

				response.status(200).json(output);
			});
		});
	}

};
