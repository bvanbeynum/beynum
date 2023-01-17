import client from "superagent";
import jwt from "jsonwebtoken";
import config from "./config.js";

export default {
	
	loadSetup: (request, response, next) => {
		request.serverPath = `${ request.protocol }://${ request.headers.host }`;
		next();
	},

	validateInternal: (request, response, next) => {
		if (request.get("isinternal") === "true") {
			next();
		}
		else {
			response.status(401).send();
		}
	},

	authenticate: (request, response, next) => {
		const token = request.cookies.by ? request.cookies.by
			: request.headers.authorization && /^bearer [\S]+$/i.test(request.headers.authorization) ? request.headers.authorization.split(" ")[1] 
			: null;

		if (token) {
			try {
				const tokenData = jwt.verify(token, config.jwt);

				if (tokenData.token) {
					client.get(`${ request.serverPath }/data/user?devicetoken=${ tokenData.token }`)
						.then(clientResponse => {
							if (clientResponse.body.users && clientResponse.body.users.length === 1) {
								request.user = clientResponse.body.users[0];
								request.device = (({ _id, ...device }) => ({ ...device, id: _id }))(request.user.devices.find(device => device.token === tokenData.token));
								request.user.devices = request.user.devices.map(device => ({
									...device,
									lastAccess: tokenData.token === device.token ? new Date() : device.lastAccess
								}));

								client.post(`${ request.serverPath }/data/user`)
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

	getJobs: (request, response) => {
		client.get(`${ request.serverPath }/data/job`)
			.then(clientResponse => {
				const output = {
					jobs: clientResponse.body.jobs
				};

				response.status(200).json(output);
			})
			.catch(error => {
				response.statusMessage = error.message;
				response.status(561).json({ error: error.message });
			});
	},

	saveJobRun: async (request, response) => {
		if (!request.query.jobid || !request.body.jobrun) {
			response.statusMessage = "Missing object to save";
			response.status(561).json({ error: "Missing object to save" });
			return;
		}

		let clientResponse = null;
		try {
			clientResponse = await client.get(`${ request.serverPath }/data/job?id=${ request.query.jobid }`);
		}
		catch (error) {
			response.statusMessage = "Error pulling job details";
			response.status(562).json({ location: "Pull job details", error: error.message });
			return;
		}

		const job = clientResponse.body.jobs[0],
			saveRun = response.body.jobrun;

		if (job.runs.some(run => run["_id"] === saveRun["_id"])) {
			job.runs = job.runs.map(run => {
				return run["_id"] == saveRun["_id"] ? saveRun : run
			});
		}
		else {
			job.runs.push(response.body.jobrun);
		}

		try {
			clientResponse = await client.post(`${ request.serverPath }/data/job`).send({ job: job });
		}
		catch (error) {
			response.statusMessage = "Error saving job";
			response.status(563).json({ location: "Save job", error: error.message });
			return;
		}

		response.status(200).json({ id: job.id });
	}

}