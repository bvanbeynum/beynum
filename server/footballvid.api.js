import client from "superagent";
import jwt from "jsonwebtoken";
import config from "./config.js";
import fs from "fs";
import path from "path";

export default {

	validate: (request, response) => {
		if (request.query.token) {
			client.get(`${ request.serverPath }/data/user?usertoken=${ request.query.token }`)
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

						client.post(`${ request.serverPath }/data/user`)
							.send({ user: user })
							.then(() => {

								const encryptedToken = jwt.sign({ token: request.query.token }, config.jwt);
								response.cookie("by", encryptedToken, { maxAge: 999999999999 });
								response.redirect(request.query.redirect);
								
							})
							.catch(() => {
								response.status(401).send();
							})
					}
					else {
						response.status(401).send();
					}
				})
				.catch(() => {
					response.status(401).send();
				});
		}
		else {
			response.status(401).send();
		}
	},

	hasAccess: (request, response, next) => {
		if (request.user) {
			next();
		}
		else {
			response.status(401).send("Unauthorized");
		}
	},

	uploadVideo: (request, response) => {
		const tempPath = path.join(request.app.get("root"), "client/static/temp"),
			fileName = tempPath + "/" + Date.now() + ".mp4";
		
		request.busboy.on("file", (fieldName, file, upload) => {
			if (!/.mp4$/i.test(upload.filename)) {
				response.status(561).json({ error: "File is not an mp4 file" });
				return;
			}
			file.pipe(fs.createWriteStream(fileName));
		});

		request.busboy.on("finish", () => {
			response.status(200).json({status: "ok"});
		});
		
		request.pipe(request.busboy);
	},

	uploadImageData: (request, response) => {
		if (!request.body.imagedata) {
			response.statusMessage = "Missing object to save";
			response.status(560).json({ error: "Missing object to save" });
			return;
		}

		client.post(`${ request.serverPath }/footballvid/data/image`)
			.send({ imagedata: request.body.imagedata })
			.set("isinternal", "true")
			.then(clientResponse => {
				response.status(200).json({ imageId: clientResponse.body.id });
			})
			.catch(error => {
				response.statusMessage = error.message;
				response.status(561).json({ error: error.message });
			});
	}

}
