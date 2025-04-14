import client from "superagent";
import jwt from "jsonwebtoken";
import config from "./config.js";

export default {
	
	loadSetup: (request, response, next) => {
		request.serverPath = `${ request.protocol }://${ request.headers.host }`;
		request.logUrl = `${ request.protocol }://beynum.com/sys/api/addlog`;
		next();
	},

	authInternal: (request, response, next) => {
		if (request.headers["x-forwarded-for"] && !/10\.21\.0/g.test(request.headers["x-forwarded-for"])) {
			response.status(401).send("Unauthorized");
		}
		else {
			next();
		}
	},

	authAPI: (request, response, next) => {
		const re = new RegExp(request.serverPath);

		if (re.test(request.headers["referer"])) {
			next();
		}
		else {
			response.status(401).send("Unauthorized");
		}
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
	}

}