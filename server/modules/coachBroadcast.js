import client from "superagent";
import config from "../config.js";
import { google } from "googleapis";
import { Readable } from "stream";
import * as marked from './marked.cjs';
const markedParse = marked.marked;

let Gmail = null;
let Drive = null;
let oAuth2Client = null;

/**
 * Extracts text from a Gmail attachment using a robust two-step process:
 * 1. Upload the file to Drive.
 * 2. Copy the uploaded file into a new Google Doc, forcing OCR conversion.
 * @param {GmailAttachment} attachment The attachment object from Gmail.
 * @return {string} The extracted text from the document.
 */
async function getTextFromAttachment(messageId, attachmentId, filename, mimeType) {
	let uploadedFileId = null;
	let convertedDocId = null;
	let extractedText = '';

	try {
		// 1. Get attachment content from Gmail
		const attachment = await Gmail.users.messages.attachments.get({
			userId: 'me',
			messageId: messageId,
			id: attachmentId,
		});

		const buffer = Buffer.from(attachment.data.data, 'base64');
		const stream = new Readable();
		stream.push(buffer);
		stream.push(null);

		// 2. Upload to Drive
		const uploadedFile = await Drive.files.create({
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
		const convertedDoc = await Drive.files.copy({
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
		const exportedDoc = await Drive.files.export({
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
			await Drive.files.delete({ fileId: uploadedFileId });
		}
		if (convertedDocId) {
			await Drive.files.delete({ fileId: convertedDocId });
		}
	}

	return extractedText;
}

async function convertAttachments(message, emailResponse) {
	// Send the attachments to google drive to use OCR to extract the text
	let attachmentText = "";
	if (emailResponse.data.payload.parts) {
		for (const part of emailResponse.data.payload.parts) {
			if (part.filename && part.body && part.body.attachmentId) {

				if (part.mimeType === "application/pdf" || part.mimeType.startsWith("image/")) {
					const extractedText = await getTextFromAttachment(message.id, part.body.attachmentId, part.filename, part.mimeType);

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
	return attachmentText;
}

async function loadDriveData(indexSheetId) {
	const sheets = google.sheets({ version: "v4", auth: oAuth2Client });

	// Get the index sheet
	
	const sheetIndexSheet = await sheets.spreadsheets.values.get({
		spreadsheetId: indexSheetId,
		range: "Sheets!A2:C",
	});

	if (!sheetIndexSheet) {
		throw new Error("Could not load the index sheet");
	}

	let teamEmailSheetId = null;
	sheetIndexSheet.data.values.forEach(row => {
		if (row[0] && row[0] == "Team Email" && row[1]) {
			const teamEmailSheetUrl = row[1];
			const match = teamEmailSheetUrl.match(/\/d\/([^\/]+)/);
			if (match) {
				teamEmailSheetId = match[1];
			}
		}
	});

	// Get the team email sheet

	const sheetDetails = await sheets.spreadsheets.get({
		spreadsheetId: teamEmailSheetId,
	});

	if (!sheetDetails) {
		throw new Error("Could not load the team email sheet.");
	}

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
		spreadsheetId: teamEmailSheetId,
		range: `${parentEmailsSheetName}!A1:Z1`,
	});

	const header = headerResponse.data.values[0];
	const emailColumnIndex = header.indexOf("Email Address");

	if (emailColumnIndex === -1) {
		throw new Error("Column 'Email Address' not found in 'Parent Emails' sheet.");
	}

	const emailColumn = String.fromCharCode(65 + emailColumnIndex);

	const teamEmailResponse = await sheets.spreadsheets.values.get({
		spreadsheetId: teamEmailSheetId,
		range: `${parentEmailsSheetName}!${emailColumn}2:${emailColumn}`,
	});

	const parentEmails = teamEmailResponse.data.values ? teamEmailResponse.data.values.flat().filter(email => email) : [];

	// Get the configuration settings
	const configValuesResponse = await sheets.spreadsheets.values.get({
		spreadsheetId: teamEmailSheetId,
		range: "Config!A2:B",
	});

	const configValues = {};
	configValuesResponse.data.values.forEach(row => {
		if (row[0] && row[1]) {
			configValues[row[0]] = row[1];
		}
	});

	// Get the coach's emails to watch
	const coachEmailResponse = await sheets.spreadsheets.values.get({
		spreadsheetId: teamEmailSheetId,
		range: "Config!D2:D",
	});

	const coachEmails = coachEmailResponse.data.values.filter(row => row[0]).map(row => row[0]);

	const coachName = configValues["Coach Name"];
	const teamName = configValues["Team Name"];
	const teamEmail = configValues["Team Email"];

	if (!coachEmails || coachEmails.length === 0 || !coachName || !teamName || !teamEmail) {
		throw new Error("Missing configuration values in 'Config' Google Sheet.");
	}

	return {
		parentEmails: parentEmails,
		coachEmails: coachEmails,
		coachName: coachName,
		teamName: teamName,
		teamEmail: teamEmail
	};
}

async function rewriteWithGemini(body, attachmentText, coachName, teamName) {
	const API_KEY = config.geminiAPIKey;
	if (!API_KEY) {
		console.error("GEMINI_API_KEY not set.");
		return {
			status: 581,
			error: `GEMINI_API_KEY not set.`
		};
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
			return {
				text: response.body.candidates[0].content.parts[0].text
			};
		} else {
			return {
				status: 580,
				error: `Error calling Gemini API. Status: ${response.status}. Response: ${JSON.stringify(response.body)}`
			};
		}
	} catch (e) {
		return {
			status: 581,
			error: `Exception calling Gemini API: ${e.message}`
		};
	}
}

export default {

	runProcess: async (user) => {
		let totalDraftsCreated = 0;
		const userConfig = {};

		try {
			// Get Team Email Google Sheet
			if (!user.refreshToken || !user.refreshExpireDate) {
				throw new Error("User refresh token or expiry date not found. Please re-authenticate with Google.");
			}

			if (new Date(user.refreshExpireDate) < new Date()) {
				throw new Error("Google refresh token expired. Please re-authenticate with Google.");
			}

			if (!user.indexSheetId) {
				throw new Error("Google refresh token expired. Please re-authenticate with Google.");
			}

			oAuth2Client = new google.auth.OAuth2(
				config.google.client_id,
				config.google.client_secret,
				config.google.redirect_uris[0]
			);

			oAuth2Client.setCredentials({
				refresh_token: user.refreshToken,
			});
			
			Drive = google.drive({ version: "v3", auth: oAuth2Client });

			const driveOutput = await loadDriveData(user.indexSheetId);
			userConfig.parentEmails = driveOutput.parentEmails;
			userConfig.coachEmails = driveOutput.coachEmails;
			userConfig.coachName = driveOutput.coachName;
			userConfig.teamName = driveOutput.teamName;
			userConfig.teamEmail = driveOutput.teamEmail;

		}
		catch (error) {
			console.log(`error: ${error.message}`)
			return {
				status: 570,
				error: error.message
			};
		}

		try {
			// Construct the search query to look for emails from any of the coachEmails that is unread
			const searchQuery = `is:unread (${userConfig.coachEmails.map(email => `from:${email}`).join(' OR ')})`;

			Gmail = google.gmail({ version: 'v1', auth: oAuth2Client });
			const gmailResponse = await Gmail.users.messages.list({
				userId: 'me',
				q: searchQuery,
			});

			// If no emails are found, then return a successful response indicating no emails to process
			if (!gmailResponse.data.messages || gmailResponse.data.messages.length === 0) {
				return {
					status: 200,
					message: "No new coach emails to process."
				};
			}

			for (const message of gmailResponse.data.messages) {
				const emailResponse = await Gmail.users.messages.get({
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

				const attachmentText = await convertAttachments(message, emailResponse);
				const rewrittenEmail = await rewriteWithGemini(body, attachmentText, userConfig.coachName, userConfig.teamName);

				if (rewrittenEmail.error) {
					throw new Error(`Gemini error (${ rewrittenEmail.status }): ${ rewrittenEmail.error }`);
				}

				const htmlEmailBody = '<meta charset="UTF-8">' + markedParse(rewrittenEmail.text);
				const batchSize = 40;

				for (let emailIndex = 0; emailIndex < userConfig.parentEmails.length; emailIndex += batchSize) {
					const emailBatch = userConfig.parentEmails.slice(emailIndex, emailIndex + batchSize);

					const boundary = `----=_Part_${Math.random().toString().slice(2)}`;
					const emailLines = [
						`To: ${userConfig.teamEmail}`,
						`Bcc: ${emailBatch.join(',')}`,
						`Subject: ${subject}`,
						'MIME-Version: 1.0',
						`Content-Type: multipart/mixed; boundary="${boundary}"`,
						'',
						`--${boundary}`,
						'Content-Type: text/html; charset="UTF-8"',
						'Content-Transfer-Encoding: 7bit',
						'',
						htmlEmailBody,
						''
					];

					const attachments = [];
					if (emailResponse.data.payload.parts) {
						for (const part of emailResponse.data.payload.parts) {
							if (part.filename && part.body && part.body.attachmentId) {
								attachments.push(part);
							}
						}
					}

					for (const part of attachments) {
						const attachmentData = await Gmail.users.messages.attachments.get({
							id: part.body.attachmentId,
							messageId: message.id,
							userId: 'me'
						});
						emailLines.push(`--${boundary}`);
						emailLines.push(`Content-Type: ${part.mimeType}; name="${part.filename}"`);
						emailLines.push('Content-Transfer-Encoding: base64');
						emailLines.push(`Content-Disposition: attachment; filename="${part.filename}"`);
						emailLines.push('');
						emailLines.push(attachmentData.data.data);
						emailLines.push('');
					}

					emailLines.push(`--${boundary}--`);

					const email = emailLines.join('\r\n');
					const base64EncodedEmail = Buffer.from(email).toString('base64url');

					await Gmail.users.drafts.create({
						userId: 'me',
						requestBody: {
							message: {
								raw: base64EncodedEmail
							}
						}
					});

					totalDraftsCreated++;
				}
				await Gmail.users.messages.modify({
					userId: 'me',
					id: message.id,
					requestBody: {
						removeLabelIds: ['UNREAD']
					}
				});

			}

			return {
				status: 200,
				draftsCreated: totalDraftsCreated
			};
		}
		catch (error) {
			return {
				status: 571,
				error: error.message
			};
		}
	}

};