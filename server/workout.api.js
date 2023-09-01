import client from "superagent";

export default {

	authenticate: (request, response, next) => {
		if (request.user && request.user.apps && request.user.apps.includes("workout")) {
			next();
		}
		else {
			response.status(200).json({ isRestricted: true });
		}
	},

	load: async (request, response) => {
		const output = {
			user: request.user
		};

		try {
			const clientResponse = await client.get(`${ request.serverPath }/workout/data/exercise`);
			output.exercises = clientResponse.body.exercises;
		}
		catch (error) {
			client.post(`${ request.serverPath }/sys/api/addlog`).send({ log: { logTime: new Date(), logTypeId: "6442a3c438baa8f160ae8e23", message: `561: ${error.message}` }});
			response.statusMessage = error.message;
			response.status(561).json({ location: "Get exercises", error: error.message });
			return;
		}

		try {
			const clientResponse = await client.get(`${ request.serverPath }/workout/data/activity?userid=${ request.user.id }`);
			output.lastActivity = clientResponse.body.activities ? clientResponse.body.activities.slice(-1) : null;
		}
		catch (error) {
			client.post(`${ request.serverPath }/sys/api/addlog`).send({ log: { logTime: new Date(), logTypeId: "6442a3c438baa8f160ae8e23", message: `562: ${error.message}` }});
			response.statusMessage = error.message;
			response.status(562).json({ location: "Get activities", error: error.message });
			return;
		}

		response.status(200).json(output);
	}

};