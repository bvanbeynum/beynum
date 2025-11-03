import client from "superagent";
import config from "./config.js";
import { google } from "googleapis";

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
							window.opener.postMessage(${JSON.stringify(output)}, 'https://beynum.com');
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
							window.opener.postMessage({ error: "${error.message}" }, 'https://beynum.com');
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
			const clientResponse = await client.get(`${ request.serverPath }/vtp/data/vtpuser?id=${ request.query.id }`);
			user = clientResponse.body.vtpUsers[0];
		}
		catch (error) {
			response.status(560).json({ error: error.message });
			return;
		}

		try {
			// Get Team Email Google Sheet
			if (!user.refreshToken || !user.refreshExpireDate) {
				throw new Error("User refresh token or expiry date not found. Please re-authenticate with Google.");
			}

			// if (new Date(user.refreshExpireDate) < new Date()) {
			// 	throw new Error("Google refresh token expired. Please re-authenticate with Google.");
			// }

			const oAuth2Client = new google.auth.OAuth2(
				config.google.client_id,
				config.google.client_secret,
				config.google.redirect_uris[0]
			);

			oAuth2Client.setCredentials({
				refresh_token: user.refreshToken,
			});

			const sheets = google.sheets({ version: "v4", auth: oAuth2Client });
			const drive = google.drive({ version: "v3", auth: oAuth2Client });

			const searchResult = await drive.files.list({
				q: "name='Team Email' and mimeType='application/vnd.google-apps.spreadsheet'",
				fields: "files(id, name)",
			});

			const teamEmailSheet = searchResult.data.files[0];

			if (!teamEmailSheet) {
				throw new Error("Google Sheet 'Team Email' not found in your Google Drive.");
			}

			const spreadsheetId = teamEmailSheet.id;

			const sheetDetails = await sheets.spreadsheets.get({
				spreadsheetId: spreadsheetId,
			});

			console.log(`Sheet Details: ${JSON.stringify(sheetDetails.data.sheets.map(s => s.properties.title))}`);

			const teamEmailsSheet = sheetDetails.data.sheets.find(s => s.properties.title === "Parent Emails");
			const configSheet = sheetDetails.data.sheets.find(s => s.properties.title === "Config");

			if (!teamEmailsSheet) {
				throw new Error("Worksheet 'Team Email' not found in 'Team Email' Google Sheet.");
			}

			if (!configSheet) {
				throw new Error("Worksheet 'Config' not found in 'Team Email' Google Sheet.");
			}

			const configValuesResponse = await sheets.spreadsheets.values.get({
				spreadsheetId: spreadsheetId,
				range: "Config!A2:B",
			});

			const configValues = {};
			configValuesResponse.data.values.forEach(row => {
				if (row[0] && row[1]) {
					configValues[row[0]] = row[1];
				}
			});

			console.log(`Config: ${JSON.stringify(configValues)}`);

			response.status(200).json({ config: configValues });
		}
		catch (error) {
			response.status(570).json({ error: error.message });
			return;
		}
	}

};
