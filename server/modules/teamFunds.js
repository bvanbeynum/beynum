import client from "superagent";
import config from "../config.js";
import { google } from "googleapis";
import * as marked from "./marked.cjs";
const markedParse = marked.marked;

let Sheets = null;
let Gmail = null;
let oAuth2Client = null;

const CONFIG_SHEET_NAME = "Config";
const TEAM_SHEET_NAME = "Team";

async function loadSheetData(indexSheetId) {
	
	// Get the index sheet
	
	const sheetIndexSheet = await Sheets.spreadsheets.values.get({
		spreadsheetId: indexSheetId,
		range: "Sheets!A2:C",
	});

	if (!sheetIndexSheet) {
		throw new Error("Could not load the index sheet");
	}

	let teamFundsSheetId = null;
	sheetIndexSheet.data.values.forEach(row => {
		if (row[0] && row[0] == "Team Funds" && row[1]) {
			const teamFundsSheetURL = row[1];
			const match = teamFundsSheetURL.match(/\/d\/([^\/]+)/);
			if (match) {
				teamFundsSheetId = match[1];
			}
		}
	});

	if (!teamFundsSheetId) {
		throw new Error("Could not find the Team Funds Google Sheet.");
	}

	const userConfig = {};
	const configResponse = await Sheets.spreadsheets.values.get({
		spreadsheetId: teamFundsSheetId,
		range: `${CONFIG_SHEET_NAME}!A2:B`,
	});

	if (configResponse.data.values) {
		configResponse.data.values.forEach(row => {
			if (row[0]) {
				userConfig[row[0]] = row[1];
			}
		});
	}

	const wrestlerSheet = await Sheets.spreadsheets.values.get({
		spreadsheetId: teamFundsSheetId,
		range: `${TEAM_SHEET_NAME}!A2:E`,
	});

	const wrestlers = [];
	if (wrestlerSheet.data.values) {
		wrestlerSheet.data.values.forEach((row, index) => {
			wrestlers.push({
				name: row[0],
				parents: row[1],
				emails: row[2],
				fundsPaid: (row[3] || "") !== "",
				emailCount: parseInt(row[4], 10) || 0,
				row: index + 2
			});
		});
	}

	return {
		teamFundsSheetId,
		userConfig,
		wrestlers
	};
}

function createGeminiPrompt(wrestler, userConfig, reminderNumber) {
	let reminder = "";
	if (reminderNumber > 1) {
		reminder = `This is a friendly reminder. We still need to collect funds to have enough to feed the team for the full season.`;
	}

	return `
		You are a helpful parent volunteer for the fort mill high school wrestling team. Your task is to request funds from other team wrestling parents to be used to feed the team at the wrestling events this season.

		${reminder}
	
		Here are your instructions:
		- Keep the tone friendly, communal, and direct, but not demanding.
		- Start with a friendly greeting to ${wrestler.parents}.
		- Be clear about the amount requested and that the funds will be used to buy food for the wrestlers for each event.
		- Clearly state the main points. Use Markdown for formatting like bullet points for lists if it makes it easier to read.
		- Conclude with exciting support for the Fort Mill wrestling team, and thank them for supporting the team.
		- DO NOT use a subject line, just write the body of the email.
		- IMPORTANT: Do not add any information.

		---
		CONTEXT FOR THE EMAIL:
		- Parent Names: ${wrestler.parents}
		- Wrestler's Name: ${wrestler.name}
		- Total Amount Requested Per Wrestler: $${userConfig["Amount Requested"]}
		- Events: ${userConfig["Event Days"]}
		- Funds used for snacks, drinks, and dinner for overnight events
		- Payment method: ${userConfig["Pay Information"]}
		---
	`;
}

async function callGeminiAPI(prompt) {
	const API_KEY = config.geminiAPIKey;
	if (!API_KEY) {
		throw new Error("GEMINI_API_KEY not set.");
	}
	const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;

	const requestBody = {
		"contents": [{
			"parts": [{
				"text": prompt
			}]
		}]
	};

	try {
		const response = await client.post(url)
			.send(requestBody)
			.set("Content-Type", "application/json");

		if (response.status === 200) {
			return response.body.candidates[0].content.parts[0].text;
		} else {
			throw new Error(`Gemini API Error: ${response.status} - ${JSON.stringify(response.body)}`);
		}
	} catch (e) {
		throw new Error(`Exception calling Gemini API: ${e.message}`);
	}
}

async function generateAndSendEmail(wrestler, userConfig, teamFundsSheetId) {
	try {
		const recipientEmails = wrestler.emails.split(",").map(email => email.trim()).join(",");

		if (!recipientEmails) {
			console.log(`Skipping wrestler ${wrestler.name} due to no email addresses.`);
			return;
		}

		const reminderNumber = wrestler.emailCount + 1;
		const prompt = createGeminiPrompt(wrestler, userConfig, reminderNumber);
		const geminiResponse = await callGeminiAPI(prompt);

		const htmlBody = markedParse(geminiResponse);
		const subject = "Wrestling Feed the Varsity Team Funds";

		const emailLines = [
			`To: ${recipientEmails}`,
			`Subject: ${subject}`,
			"MIME-Version: 1.0",
			"Content-Type: text/html; charset=\"UTF-8\"",
			"Content-Transfer-Encoding: 7bit",
			"",
			htmlBody,
			""
		];

		const email = emailLines.join("\r\n");
		const base64EncodedEmail = Buffer.from(email).toString("base64url");

		await Gmail.users.drafts.create({
			userId: "me",
			requestBody: {
				message: {
					raw: base64EncodedEmail
				}
			}
		});

		console.log(`Created draft for ${wrestler.name} (Reminder #${reminderNumber}).`);
		await incrementEmailCount(wrestler.row, teamFundsSheetId);

	} catch (e) {
		console.log(`Failed to generate or send email for ${wrestler.name}. Error: ${e.toString()}`);
	}
}

async function incrementEmailCount(rowNum, teamFundsSheetId) {
	const currentCount = await Sheets.spreadsheets.values.get({
		spreadsheetId: teamFundsSheetId,
		range: `${TEAM_SHEET_NAME}!E${rowNum}`,
	});

	const count = currentCount.data.values ? (parseInt(currentCount.data.values[0][0], 10) || 0) + 1 : 1;

	await Sheets.spreadsheets.values.update({
		spreadsheetId: teamFundsSheetId,
		range: `${TEAM_SHEET_NAME}!E${rowNum}`,
		valueInputOption: "RAW",
		requestBody: {
			values: [[count]]
		}
	});
}

export default {

	runProcess: async (user) => {
		try {
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

			Sheets = google.sheets({ version: "v4", auth: oAuth2Client });
			Gmail = google.gmail({ version: "v1", auth: oAuth2Client });

			const { teamFundsSheetId, userConfig, wrestlers } = await loadSheetData(user.indexSheetId);

			const now = new Date();
			let emailsSentCount = 0;

			console.log(`Processing team funds`);

			const wrestlersToEmail = wrestlers.filter(w => !w.fundsPaid);
			emailsSentCount = wrestlersToEmail.length;

			if (wrestlersToEmail.length === 0) {
				console.log("All wrestlers have paid. No emails to send.");
				return { status: 200, message: "All wrestlers have paid. No emails to send." };
			}

			console.log(`Found ${wrestlersToEmail.length} wrestlers to email.`);

			for (const wrestler of wrestlersToEmail) {
				await generateAndSendEmail(wrestler, userConfig, teamFundsSheetId);
			}

			if (!scheduleProcessed) {
				return { status: 200, message: "No pending schedules to process at this time." };
			}

			return { status: 200, message: `${emailsSentCount} emails processed.` };

		} catch (error) {
			console.log(`An error occurred in the main process: ${error.toString()}`);
			return {
				status: 570,
				error: error.message
			};
		}
	}
};
