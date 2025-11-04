import client from "superagent";
import config from "./config.js";
import { google } from "googleapis";
import { Readable } from "stream";

/**
 * Extracts text from a Gmail attachment using a robust two-step process:
 * 1. Upload the file to Drive.
 * 2. Copy the uploaded file into a new Google Doc, forcing OCR conversion.
 * @param {GmailAttachment} attachment The attachment object from Gmail.
 * @return {string} The extracted text from the document.
 */
async function getTextFromAttachment(gmail, drive, messageId, attachmentId, filename, mimeType) {
	let uploadedFileId = null;
	let convertedDocId = null;
	let extractedText = '';

	try {
		// 1. Get attachment content from Gmail
		const attachment = await gmail.users.messages.attachments.get({
			userId: 'me',
			messageId: messageId,
			id: attachmentId,
		});

		const buffer = Buffer.from(attachment.data.data, 'base64');
		const stream = new Readable();
		stream.push(buffer);
		stream.push(null);

		// 2. Upload to Drive
		const uploadedFile = await drive.files.create({
			requestBody: {
				name: filename,
			},
			media: {
				mimeType: mimeType,
				body: stream,
			},
			fields: 'id',
		});
		uploadedFileId = uploadedFile.data.id;

		if (!uploadedFileId) {
			throw new Error('Failed to upload the initial file to Drive.');
		}

		await new Promise(resolve => setTimeout(resolve, 3000));

		// 3. Copy to Google Doc to trigger OCR
		const newDocTitle = filename.replace(/\.[^/.]+$/, '');
		const convertedDoc = await drive.files.copy({
			fileId: uploadedFileId,
			ocr: true,
			ocrLanguage: 'en',
			requestBody: {
				name: newDocTitle,
				mimeType: 'application/vnd.google-apps.document',
			},
			fields: 'id',
		});
		convertedDocId = convertedDoc.data.id;

		if (!convertedDocId) {
			throw new Error('Failed to get an ID for the converted Google Doc.');
		}

		// 4. Export the Google Doc as plain text
		const exportedDoc = await drive.files.export({
			fileId: convertedDocId,
			mimeType: 'text/plain',
		}, { responseType: 'stream' });

		extractedText = await new Promise((resolve, reject) => {
			let text = '';
			exportedDoc.data.on('data', chunk => (text += chunk));
			exportedDoc.data.on('end', () => resolve(text));
			exportedDoc.data.on('error', reject);
		});

	} catch (e) {
		console.error(`Fatal error during text extraction: ${e.message}`);
		return `[Error: Could not process attachment: ${filename}]`;
	} finally {
		// 5. Clean up
		if (uploadedFileId) {
			await drive.files.delete({ fileId: uploadedFileId });
		}
		if (convertedDocId) {
			await drive.files.delete({ fileId: convertedDocId });
		}
	}

	return extractedText;
}

async function rewriteWithGemini(subject, body, attachmentText, coachName, parentName, teamName) {
	const API_KEY = config.geminiAPIKey;
	if (!API_KEY) {
		console.error("GEMINI_API_KEY not set.");
		return null;
	}
	const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;

	const attachmentPromptSection = attachmentText
		? `
---
IMPORTANT: Please also incorporate the key information from this attached document:
ATTACHED DOCUMENT TEXT:
${attachmentText}
---
`
		: '';

	const prompt = `
You are a helpful parent volunteer for the fort mill high school wrestling team, the ${teamName}. Your task is to rewrite an email from Coach ${coachName} into a clear, friendly, and concise message for all the other parents.

Here are your instructions:
- Keep the tone positive, encouraging and excited.
- Start with a friendly greeting like "Hi Team Parents,".
- Clearly state the main points (e.g., practice time changes, game location, required gear). Use bullet points for lists if it makes it easier to read.
- Make it fun by adding emoji
- Remove any coach-specific jargon or overly technical language.
- Ensure all key details like dates, times, and locations are present and easy to find.
- Conclude with support for ${teamName} and don't sign your name.
- Do not include any place holders. The email should be ready to send without review.
- AVOID call to action. Only provide information in an informative way.
- Don't repeat the subject in the body.
- IMPORTANT: Do not add any information that was not in the original email body or the attached document. Just reformat and rephrase what is there.

**Original Email from Coach ${coachName}:**
Subject: ${subject}
Body:
---
${body}
---
${attachmentPromptSection}
`;

	const requestBody = { "contents": [{ "parts": [{ "text": prompt }] }] };

	try {
		const response = await client.post(url)
			.send(requestBody)
			.set('Content-Type', 'application/json');

		if (response.status === 200) {
			return response.body.candidates[0].content.parts[0].text;
		} else {
			console.error(`Error calling Gemini API. Status: ${response.status}. Response: ${JSON.stringify(response.body)}`);
			return null;
		}
	} catch (e) {
		console.error(`Exception calling Gemini API: ${e.message}`);
		return null;
	}
}

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

			const teamEmailsSheet = sheetDetails.data.sheets.find(s => s.properties.title === "Parent Emails");
			const configSheet = sheetDetails.data.sheets.find(s => s.properties.title === "Config");

			if (!teamEmailsSheet) {
				throw new Error("Worksheet 'Team Email' not found in 'Team Email' Google Sheet.");
			}

			if (!configSheet) {
				throw new Error("Worksheet 'Config' not found in 'Team Email' Google Sheet.");
			}

			// Get the team emails from the Parent Emails sheet. Look for the column with the header "Email Address"
			const parentEmailsSheetName = teamEmailsSheet.properties.title;
			const headerResponse = await sheets.spreadsheets.values.get({
				spreadsheetId: spreadsheetId,
				range: `${parentEmailsSheetName}!A1:Z1`,
			});

			const header = headerResponse.data.values[0];
			const emailColumnIndex = header.indexOf("Email Address");

			if (emailColumnIndex === -1) {
				throw new Error("Column 'Email Address' not found in 'Parent Emails' sheet.");
			}

			const emailColumn = String.fromCharCode(65 + emailColumnIndex);

			const teamEmailResponse = await sheets.spreadsheets.values.get({
				spreadsheetId: spreadsheetId,
				range: `${parentEmailsSheetName}!${emailColumn}2:${emailColumn}`,
			});

			const teamEmails = teamEmailResponse.data.values ? teamEmailResponse.data.values.flat().filter(email => email) : [];

			// Get the configuration settings
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

			// Get the coach's emails to watch
			const coachEmailResponse = await  sheets.spreadsheets.values.get({
				spreadsheetId: spreadsheetId,
				range: "Config!D2:D",
			});

			const coachEmails = coachEmailResponse.data.values.filter(row => row[0]).map(row => row[0]);

			const coachName = configValues["Coach Name"];
			const teamEmail = configValues["Team Email"];
			const teamName = configValues["Team Name"];
			const notifyEmail = configValues["Notify Email"];

			if (!coachEmails || coachEmails.length === 0 || !coachName || !teamEmail || !teamName || !notifyEmail) {
				throw new Error("Missing configuration values in 'Config' Google Sheet.");
			}

			// Construct the search query to look for emails from any of the coachEmails that is unread
			const searchQuery = `is:unread (${coachEmails.map(email => `from:${email}`).join(' OR ')})`;

			const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });
			const gmailResponse = await gmail.users.messages.list({
				userId: 'me',
				q: searchQuery,
			});

			// If no emails are found, then return a successful response indicating no emails to process
			if (!gmailResponse.data.messages || gmailResponse.data.messages.length === 0) {
				return response.status(200).json({
					message: "No new coach emails to process."
				});
			}

			const processedEmails = [];
			for (const message of gmailResponse.data.messages) {
				const emailResponse = await gmail.users.messages.get({
					userId: 'me',
					id: message.id,
					format: 'full'
				});

				// Get the subject, body and attachments from the email
				const headers = emailResponse.data.payload.headers;
				const subject = headers.find(header => header.name === 'Subject').value;
				
				let body = '';
				if (emailResponse.data.payload.parts) {
					const part = emailResponse.data.payload.parts.find(p => p.mimeType === 'text/plain');
					if (part && part.body.data) {
						body = Buffer.from(part.body.data, 'base64').toString('utf-8');
					}
				} else if (emailResponse.data.payload.body.data) {
					body = Buffer.from(emailResponse.data.payload.body.data, 'base64').toString('utf-8');
				}

				if (!body) {
					body = emailResponse.data.snippet;
				}

				// Send the attachments to google drive to use OCR to extract the text
				let attachmentText = "";
				if (emailResponse.data.payload.parts) {
					for (const part of emailResponse.data.payload.parts) {
						if (part.filename && part.body && part.body.attachmentId) {

							if (part.mimeType === "application/pdf" || part.mimeType.startsWith("image/")) {
								const extractedText = await getTextFromAttachment(gmail, drive, message.id, part.body.attachmentId, part.filename, part.mimeType);

								if (extractedText && extractedText.trim().length > 0) {
									attachmentText += `
----
Attachment: ${ part.filename }

${ extractedText }

----
`
								}
							}
						}
					}
				}
				
				const rewrittenEmail = await rewriteWithGemini(subject, body, attachmentText, coachName, user.googleName, teamName);

				processedEmails.push({
					id: message.id,
					subject: subject,
					body: body,
					attachmentText: attachmentText,
					rewrittenEmail: rewrittenEmail
				});
			}

			response.status(200).json({ 
				config: configValues,
				coachEmails: coachEmails,
				teamEmails: teamEmails,
				emails: processedEmails
			});
		}
		catch (error) {
			response.status(570).json({ error: error.message });
			return;
		}
	}

};
