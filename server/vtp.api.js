import client from "superagent";
import config from "./config.js";

async function authGoogle(request, response) {
	const googleAuthorizationUrl = "https://accounts.google.com/o/oauth2/v2/auth";
	const query = {
		client_id: config.google.client_id,
		redirect_uri: config.google.redirect_uris[0],
		response_type: "code",
		scope: "https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email",
	};

	const queryString = new URLSearchParams(query).toString();
	const authorizationUrl = `${googleAuthorizationUrl}?${queryString}`;

	response.redirect(authorizationUrl);
}

async function authGoogleCallback(request, response) {
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

		response.redirect("/vtp.html");
	} catch (error) {
		response.redirect("/vtp.html?error=" + error.message);
	}
}

export default {
	authGoogle,
	authGoogleCallback,
};
