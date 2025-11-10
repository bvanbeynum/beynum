import crypto from "crypto";
import client from "superagent";
import config from "./config.js";
import coachBroadcast from "./modules/coachBroadcast.js";
import volunteer from "./modules/volunteer.js";
import teamFunds from "./modules/teamFunds.js";

const algorithm = 'aes-256-cbc';

async function encrypt(text) {
	const secret = config.sessionSecret;
	const iv = crypto.randomBytes(16);
	const cipher = crypto.createCipheriv(algorithm, Buffer.from(secret, 'hex'), iv);
	let encrypted = cipher.update(text);
	encrypted = Buffer.concat([encrypted, cipher.final()]);
	return iv.toString('hex') + ':' + encrypted.toString('hex');
}

async function decrypt(text) {
	if (!text || text.indexOf(':') === -1) {
		return text;
	}
	const secret = config.sessionSecret;
	const textParts = text.split(':');
	const iv = Buffer.from(textParts.shift(), 'hex');
	const encryptedText = Buffer.from(textParts.join(':'), 'hex');
	const decipher = crypto.createDecipheriv(algorithm, Buffer.from(secret, 'hex'), iv);
	let decrypted = decipher.update(encryptedText);
	decrypted = Buffer.concat([decrypted, decipher.final()]);
	return decrypted.toString();
}

async function getUser(vtpUserId, serverPath) {
	try {
		const response = await client.get(`${ serverPath }/vtp/data/vtpuser?id=${ vtpUserId }`);
		if (response.body.vtpUsers && response.body.vtpUsers.length === 1) {
			const user = response.body.vtpUsers[0];
			user.googleName = await decrypt(user.googleName);
			user.googleId = await decrypt(user.googleId);
			user.refreshToken = await decrypt(user.refreshToken);
			return user;
		}
		else {
			throw new Error("User not found");
		}
	} catch (error) {
		throw new Error("Error fetching user: " + error.message);
	}
}

export default {

	authGoogle: async (request, response) => {
		const googleAuthorizationUrl = "https://accounts.google.com/o/oauth2/v2/auth";

		const scopes = [
			"https://www.googleapis.com/auth/userinfo.profile",
			"https://www.googleapis.com/auth/gmail.modify",
			"https://www.googleapis.com/auth/drive.file",
			"https://www.googleapis.com/auth/spreadsheets",
			"https://www.googleapis.com/auth/forms.body"
			]

		const query = {
			client_id: config.google.client_id,
			redirect_uri: config.google.redirect_uris[0],
			response_type: "code",
			scope: scopes.join(" "),
			access_type: "offline",
			prompt: "consent",
			state: request.query.state
		};

		const queryString = new URLSearchParams(query).toString();
		const authorizationUrl = `${googleAuthorizationUrl}?${queryString}`;

		response.redirect(authorizationUrl);
	},

	authGoogleCallback: async (request, response) => {
		if (request.query.error) {
			return response.redirect("/vtp.html?error=" + request.query.error);
		}

		try {
			const authorizationCode = request.query.code;

			const tokenResponse = await client
				.post(config.google.token_uri)
				.send({
					code: authorizationCode,
					client_id: config.google.client_id,
					client_secret: config.google.client_secret,
					redirect_uri: config.google.redirect_uris[0],
					grant_type: "authorization_code",
				});
			
			const accessToken = tokenResponse.body.access_token;
			const refreshToken = tokenResponse.body.refresh_token;
			const expiresIn = tokenResponse.body.expires_in;
			const expirationDate = new Date(new Date().getTime() + expiresIn * 1000);

			const userProfileResponse = await client
				.get("https://www.googleapis.com/oauth2/v2/userinfo")
				.set("Authorization", `Bearer ${accessToken}`);
			
			const users = await client.get(`${ request.serverPath }/vtp/data/vtpuser?googleid=${ userProfileResponse.body.id }`);
			console.log(`users: ${ JSON.stringify(users.body) }`);
			console.log(`response: ${ JSON.stringify(userProfileResponse.body) }`);
			
			if (!users.body.vtpUsers || users.body.vtpUsers.length == 0) {
				// Only allow specific Google IDs for now
				response.send(`
					<html>
						<body>
							<script>
								window.opener.postMessage({ error: "Unauthorized Google account." }, '*');
								window.close();
							</script>
							<p>Unauthorized Google account.</p>
						</body>
					</html>
				`);
				return;
			}

			let saveUser = null;
			if (users.body.vtpUsers && users.body.vtpUsers.length === 1) {
				saveUser = {
					vtpuser: {
						id: users.body.vtpUsers[0].id,
						googleName: await encrypt(userProfileResponse.body?.name),
						googleEmail: userProfileResponse.body?.email,
						indexSheetId: users.body.vtpUsers[0].indexSheetId,
						refreshToken: await encrypt(refreshToken),
						refreshExpireDate: expirationDate
					}
				};
			}
			else {
				saveUser = {
					vtpuser: {
						googleId: await encrypt(userProfileResponse.body.id),
						googleName: await encrypt(userProfileResponse.body?.name),
						refreshToken: await encrypt(refreshToken),
						refreshExpireDate: expirationDate
					}
				};
			}

			const clientResponse = await client.post(`${ request.serverPath }/vtp/data/vtpuser`).send(saveUser);
			const output = {
				id: clientResponse.body.id,
				googleId: saveUser.vtpuser.googleId,
				googleName: saveUser.vtpuser.googleName,
				indexSheetId: saveUser.vtpuser.indexSheetId,
				state: request.query.state
			};

			response.send(`
				<html>
					<body>
						<script>
							window.opener.postMessage(${JSON.stringify(output)}, '*');
							window.close();
						</script>
						<p>Authenticated successfully. You can close this window.</p>
					</body>
				</html>
			`);
		} catch (error) {
			response.send(`
				<html>
					<body>
						<script>
							window.opener.postMessage({ error: "${error.message}" }, '*');
							window.close();
						</script>
						<p>An error occurred. You can close this window.</p>
					</body>
				</html>
			`);
		}
	},

	coachBroadcast: async (request, response) => {
		if (!request.query.id) {
			response.status(550).json({ error: "Missing ID" });
			return;
		}

		let user = null;
		try {
			user = await getUser(request.query.id, request.serverPath);
		} catch (error) {
			response.status(551).json({ error: error.message });
			return;
		}
		const processResponse = await coachBroadcast.runProcess(user, request.serverPath);

		if (processResponse.error) {
			response.statusMessage = processResponse.error;
			response.status(processResponse.status ? processResponse.status : 540).send(processResponse.error);
			return;
		}

		response.status(200).json({
			draftsCreated: processResponse.draftsCreated,
			message: processResponse.message
		});
	},

	teamFunds: async (request, response) => {
		if (!request.query.id) {
			response.status(550).json({ error: "Missing ID" });
			return;
		}

		let user = null;
		try {
			user = await getUser(request.query.id, request.serverPath);
		} catch (error) {
			response.status(551).json({ error: error.message });
			return;
		}
		const processResponse = await teamFunds.runProcess(user);

		if (processResponse.error) {
			response.statusMessage = processResponse.error;
			response.status(processResponse.status ? processResponse.status : 540).send(processResponse.error);
			return;
		}

		response.status(200).json({
			message: processResponse.message
		});
	},

	volunteerBroadcast: async (request, response) => {
		if (!request.query.id) {
			response.status(550).json({ error: "Missing ID" });
			return;
		}

		let user = null;
		try {
			user = await getUser(request.query.id, request.serverPath);
		} catch (error) {
			response.status(551).json({ error: error.message });
			return;
		}
		const processResponse = await volunteer.emailBroadcast(user);

		if (processResponse.error) {
			response.statusMessage = processResponse.error;
			response.status(processResponse.status ? processResponse.status : 540).send(processResponse.error);
			return;
		}

		response.status(200).json({
			message: processResponse.message
		});
	},

	volunteerFormSubmit: async (request, response) => {
		if (!request.query.userid || !request.query.sheetid) {
			response.status(550).json({ error: "Missing ID" });
			return;
		}
		
		const params = [];
		Object.keys(request.body).forEach(key => {
			params[key] = request.body[key];
		});

		if (!params["name"] || !params["email"] || !params["selectedSlot"]) {
			response.status(550).json({ error: "Missing required form fields" });
			return;
		}

		let user = null;
		try {
			user = await getUser(request.query.userid, request.serverPath);
		} catch (error) {
			response.status(551).json({ error: error.message });
			return;
		}
		const processResponse = await volunteer.processForm(user, request.query.sheetid, params);

		if (processResponse.error) {
			response.statusMessage = processResponse.error;
			response.status(processResponse.status ? processResponse.status : 540).send(processResponse.error);
			return;
		}

		response.status(200).json({
			message: processResponse.message
		});
	},

	saveIndexSheet: async (request, response) => {
		if (!request.body.userId) {
			response.status(550).json({ error: "Missing User ID" });
			return;
		}

		if (!request.body.sheetUrl) {
			response.status(550).json({ error: "Missing Sheet URL" });
			return;
		}

		let sheetId = null;
		const sheetUrl = request.body.sheetUrl;
		const match = sheetUrl.match(/\/d\/([^\/]+)/);

		if (match) {
			sheetId = match[1];
		}
		else {
			response.status(560).json({ error: "Invalid Sheet URL" });
			return;
		}

		let saveUser = { vtpuser: null };
		try {
			const clientResponse = await client.get(`${ request.serverPath }/vtp/data/vtpuser?id=${ request.body.userId }`);
			saveUser.vtpuser = clientResponse.body.vtpUsers[0];
			saveUser.vtpuser.indexSheetId = sheetId;
		}
		catch (error) {
			response.status(570).json({ error: error.message });
			return;
		}

		try {
			await client.post(`${ request.serverPath }/vtp/data/vtpuser`).send(saveUser);

			response.status(200).json({
				sheetId: sheetId
			});
		}
		catch (error) {
			console.log(`error: ${ JSON.stringify(error) }`);
			response.status(580).json({ error: error.message });
			return;
		}
	}

};
