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

export default {
	authGoogle,
};
