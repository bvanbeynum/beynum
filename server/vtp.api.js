import client from "superagent";
import config from "./config.js";

export default {

	authGoogle: async (request, response) => {
		const googleAuthorizationUrl = "https://accounts.google.com/o/oauth2/v2/auth";
		const query = {
			client_id: config.google.client_id,
			redirect_uri: config.google.redirect_uris[0],
			response_type: "code",
			scope: "https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/drive",
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
			
			const saveUser = {
				googleName: userProfileResponse.body?.name,
				googleEmail: userProfileResponse.body?.email,
				refreshToken: refreshToken,
				refreshExpireDate: expirationDate
			};
			console.log(`save user: ${JSON.stringify(saveUser)}`);

			const clientResponse = await client.post(`${ request.serverPath }/vtp/data/vtpuser`).send(userProfileResponse.body);
			saveUser.id = clientResponse.body.id;

			response.send(`
				<html>
					<body>
						<script>
							window.opener.postMessage(${JSON.stringify(saveUser)}, '${ request.serverPath }');
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
							window.opener.postMessage({ error: "${error.message}" }, '${ request.serverPath }');
							window.close();
						</script>
						<p>An error occurred. You can close this window.</p>
					</body>
				</html>
			`);
		}
	}


};
