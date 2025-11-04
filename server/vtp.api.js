import client from "superagent";
import config from "./config.js";
import coachBroadcast from "./modules/coachBroadcast.js";

export default {

	authGoogle: async (request, response) => {
		const googleAuthorizationUrl = "https://accounts.google.com/o/oauth2/v2/auth";
		const query = {
			client_id: config.google.client_id,
			redirect_uri: config.google.redirect_uris[0],
			response_type: "code",
			scope: "https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/spreadsheets",
			access_type: "offline",
			prompt: "consent",
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
			
			const users = await client.get(`${ request.serverPath }/vtp/data/vtpuser?email=${ userProfileResponse.body.email }`);

			let saveUser = null;
			if (users.body.vtpUsers && users.body.vtpUsers.length === 1) {
				saveUser = {
					vtpuser: {
						id: users.body.vtpUsers[0].id,
						googleName: userProfileResponse.body?.name,
						googleEmail: userProfileResponse.body?.email,
						refreshToken: refreshToken,
						refreshExpireDate: expirationDate
					}
				};
			}
			else {
				saveUser = {
					vtpuser: {
						googleName: userProfileResponse.body?.name,
						googleEmail: userProfileResponse.body?.email,
						refreshToken: refreshToken,
						refreshExpireDate: expirationDate
					}
				};
			}

			const clientResponse = await client.post(`${ request.serverPath }/vtp/data/vtpuser`).send(saveUser);
			const output = {
				id: clientResponse.body.id,
				googleName: saveUser.vtpuser.googleName,
				googleEmail: saveUser.vtpuser.googleEmail
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

		const processResponse = await coachBroadcast.runProcess(request.query.id, request.serverPath);

		if (processResponse.error) {
			response.statusMessage = processResponse.error;
			response.status(processResponse.status ? processResponse.status : 540).send(processResponse.error);
			return;
		}

		console.log(`response: ${JSON.stringify(processResponse)}`);
		response.status(200).json({
			draftsCreated: processResponse.draftsCreated,
			message: processResponse.message
		});
	}

};
