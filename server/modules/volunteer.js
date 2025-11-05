import client from "superagent";
import config from "../config.js";
import { google } from "googleapis";
import * as marked from "./marked.cjs";
const markedParse = marked.marked;

let Sheets = null;
let Gmail = null;
let Forms = null;
let oAuth2Client = null;

const NEEDED_SHEET_NAME = "Needed";
const EMAIL_SHEET_NAME = "Parent Emails";
const SIGNUPS_SHEET_NAME = "Signups";
const CONFIG_SHEET_NAME = "Config";

async function getConfigData(sheetId) {
	const configValues = {};
	const configResponse = await Sheets.spreadsheets.values.get({
		spreadsheetId: sheetId,
		range: `${CONFIG_SHEET_NAME}!A2:B`
	});

	if (configResponse.data.values) {
		configResponse.data.values.forEach(row => {
			if (row[0]) {
				configValues[row[0]] = row[1];
			}
		});
	}

	const scheduleValues = await Sheets.spreadsheets.values.get({
		spreadsheetId: sheetId,
		range: `${CONFIG_SHEET_NAME}!D2:E`,
	});

	const emailSchedules = [];
	if (scheduleValues.data.values) {
		scheduleValues.data.values.forEach((row, index) => {
			if (row[0]) {
				emailSchedules.push({
					date: new Date(row[0]),
					sentStatus: row[1] || "",
					row: index + 2
				});
			}
		});
	}

	const userConfig = { ...configValues, emailSchedules };

	return userConfig;
}

async function getOpenVolumnteerNeeds(needsData) {
	const openNeeds = [];
	if (needsData) {
		needsData.forEach(row => {
			
			const [ position, dateTime, needed, filled, remaining ] = row;

			if (position && parseInt(remaining) > 0) {
				openNeeds.push({
					position: position,
					dateTime: new Date(dateTime),
					remaining: parseInt(remaining)
				});
			}

		});
	}

	return openNeeds;
}

async function updateGoogleForm(formUrl, openNeeds) {
	if (!formUrl) {
		throw new Error("Form URL is missing in Config sheet. Cannot update form.");
	}

	const formId = formUrl.match(/\/d\/([^\/]+)/)[1];

	const form = await Forms.forms.get({ formId: formId });
	const items = form.data.items;
	const volunteerItemIndex = items.findIndex(item => /volunteer/i.test(item.title));

	if (volunteerItemIndex === -1) {
		throw new Error("Could not find the volunteer dropdown in the form.");
	}
	const volunteerItem = items[volunteerItemIndex];

	const choices = openNeeds.map(need => {
		const formattedDate = need.dateTime.toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true });
		return {
			value: `${need.position} (${formattedDate}) - ${need.remaining} spot(s) left`
		};
	});

	if (choices.length === 0) {
		choices.push({
			value: "All spots are currently filled. Thank you!"
		});
	}

	const updateRequest = {
		requests: [
			{
				updateItem: {
					item: {
						itemId: volunteerItem.itemId,
						questionItem: {
							question: {
								choiceQuestion: {
									type: "DROP_DOWN",
									options: choices
								}
							}
						}
					},
					location: {
						index: volunteerItemIndex
					},
					updateMask: "questionItem.question.choiceQuestion.options"
				}
			}
		]
	};

	await Forms.forms.batchUpdate({
		formId: formId,
		resource: updateRequest
	});
}

async function generateEmail(userConfig, openNeeds, emailVersion) {
	const needsString = openNeeds.map(need => {
		const date = new Date(need.dateTime);
		const formattedDate = date.toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true });
		return `<tr><td>${need.position}</td><td>${formattedDate}</td><td>${need.remaining} spost(s) left</td></tr>`;
	}).join("");

	const daysToEvent = new Date(userConfig["Event Date"]).getDate() - new Date().getDate();

	const prompt = `
You are an enthusiastic parent volunteer for the Fort Mill High School Yellow Jackets wrestling team.
Write a friendly and encouraging ${ emailVersion } email to fellow parents asking them to volunteer for ${userConfig['Event Name']}.

Event Name: ${userConfig['Event Name']}
From Name: ${userConfig['From Name']}

Use this exact list of open volunteer spots:
<table>
<tr>
<td>Position</td><td>Date/Time</td><td>Open Spots</td>
</tr>
<thead>
</thead>
<tbody>
	${needsString}
</tbody>
</table>

Instructions:
- Do not include the subject.
- Start with a warm greeting like "Hello Wrestling Families,".
- Mention the upcoming "${userConfig['Event Name']}" and state that parent help is crucial for the event to run smoothly, and so it doesn't run late.
- Make it fun by adding emoji
- Include countdown to the event in ${ daysToEvent } days.
- The closer it is to the event, the more urgent the email should be.
- Use Markdown for formatting tables if it makes it easier to read.
- Clearly present the list of open volunteer spots provided above.
- Emphasize that any help is greatly appreciated.
- Encourage parents to sign up early to help us plan for a smooth event.
- Include a strong call to action with a link to sign up. Use the exact placeholder "{{SignUpLink}}" for the URL. Make the link a prominent button.
- Conclude with support for the Yellow Jackets and don't sign your name.
`

	const API_KEY = config.geminiAPIKey;
	if (!API_KEY) {
		throw new Error("GEMINI_API_KEY not set.");
	}
	const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;
	const requestBody = { "contents": [{ "parts": [{ "text": prompt }] }] };

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

async function sendEmailToParents(sheetId, userConfig, openNeeds) {
	
	const emailListData = await Sheets.spreadsheets.values.get({
		spreadsheetId: sheetId,
		range: `${EMAIL_SHEET_NAME}!B2:B`
	});

	const emailList = emailListData.data.values ? emailListData.data.values.flat().filter(email => email) : [];
	if (emailList.length === 0) {
		throw new Error("Parent email list is empty. No emails sent.");
	}
	
	const subject = userConfig["Email Subject"].replace("{{Event Name}}", userConfig["Event Name"]);

	const emailVersion = userConfig.emailSchedules.filter(schedule => schedule.sentStatus !== "").length === 0 ? "initial" : "followup";
	const geminiResponse = await generateEmail(userConfig, openNeeds, emailVersion);

	const emailBody = geminiResponse.replace(/{{SignUpLink}}/g, userConfig["Signup URL"]);
	const formattedEmailBody = markedParse(emailBody);

	const emailLines = [
		`To: ${emailList.join(",")}`,
		`Subject: ${subject}`,
		"MIME-Version: 1.0",
		"Content-Type: text/html; charset=\"UTF-8\"",
		"Content-Transfer-Encoding: 7bit",
		"",
		formattedEmailBody,
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
}

async function markScheduleAsSent(sheetId, rowNum) {
	await Sheets.spreadsheets.values.update({
		spreadsheetId: sheetId,
		range: `${CONFIG_SHEET_NAME}!E${rowNum}`,
		valueInputOption: "RAW",
		requestBody: {
			values: [[new Date().toLocaleString()]]
		}
	});
}

export default {

	emailBroadcast: async (vtxUserID, serverPath) => {
		let user = null;
		try {
			const clientResponse = await client.get(`${serverPath}/vtp/data/vtpuser?id=${vtxUserID}`);
			user = clientResponse.body.vtpUsers[0];
		}
		catch {
			return {
				status: 560,
				error: error.message
			};
		}

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
			Forms = google.forms({ version: "v1", auth: oAuth2Client });
		}
		catch (error) {
			return {
				status: 570,
				error: error.message
			};
		}

		let volunteerSheetIds = [];
		try {			
			// Get the index sheet
			
			const sheetIndexData = await Sheets.spreadsheets.values.get({
				spreadsheetId: user.indexSheetId,
				range: "Sheets!A2:C",
			});

			if (!sheetIndexData) {
				throw new Error("Could not load the index sheet");
			}

			sheetIndexData.data.values.forEach(row => {
				if (row[0] && /event -/i.test(row[0]) && row[1]) {
					const match = row[1].match(/\/d\/([^\/]+)/);
					if (match) {
						volunteerSheetIds.push(match[1]);
					}
				}
			});

			if (volunteerSheetIds.length === 0) {
				throw new Error("Could not find any Google sheets.");
			}
		}
		catch (error) {
			return {
				status: 571,
				error: error.message
			};
		}

		for (const sheetId of volunteerSheetIds) {
			let userConfig = null;
			try {
				userConfig = await getConfigData(sheetId);
				
				if (!userConfig.emailSchedules || userConfig.emailSchedules.length === 0) {
					return { status: 200, message: "No email schedules found." };
				}
			}
			catch (error) {
				return {
					status: 572,
					error: error.message
				};
			}

			const now = new Date();
			let scheduleProcessed = false;
			let emailsSentCount = 0;

			for (const schedule of userConfig.emailSchedules) {
				if (schedule.sentStatus === "" && now > schedule.date) {
					try {
						scheduleProcessed = true;
						
						const needsData = await Sheets.spreadsheets.values.get({
							spreadsheetId: sheetId,
							range: `${NEEDED_SHEET_NAME}!A2:E`
						});
						const openNeeds = await getOpenVolumnteerNeeds(needsData.data.values);

						if (openNeeds.length === 0) {
							await markScheduleAsSent(sheetId, schedule.row);
							break;
						}

						await updateGoogleForm(userConfig["Form URL"], openNeeds);
						sendEmailToParents(sheetId, userConfig, openNeeds)

						await markScheduleAsSent(sheetId, schedule.row);

						emailsSentCount++;
					}
					catch (error) {
						return {
							status: 573,
							error: error.message
						};
					}
					
					// Only send one email at a time
					break;
				}
			}

			if (!scheduleProcessed) {
				return { status: 200, message: "No pending schedules to process at this time." };
			}
			
			return { status: 200, message: `${emailsSentCount} emails processed.` };

		}

	},

	processForm: async (vtxUserID, sheetId, formValues, serverPath) => {
		let user = null;
		try {
			const clientResponse = await client.get(`${serverPath}/vtp/data/vtpuser?id=${vtxUserID}`);
			user = clientResponse.body.vtpUsers[0];
		}
		catch {
			return {
				status: 560,
				error: error.message
			};
		}

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
			Forms = google.forms({ version: "v1", auth: oAuth2Client });
		}
		catch (error) {
			return {
				status: 570,
				error: error.message
			};
		}

		try {
			// Parse the position
			const formPosition = formValues["selectedSlot"].match(/^(.*?) \(/)[1].trim();
			let formDateTime = null;
			let rowDate = null;
			
			// Find the date time from the sheet
			const positionData = await Sheets.spreadsheets.values.get({
				spreadsheetId: sheetId,
				range: `${NEEDED_SHEET_NAME}!A2:E`
			});

			const positionUpdate = [];
			for (const row of positionData.data.values) {
				const [ position, dateTime, needed, filled, remaining ] = row;

				if (!position || !dateTime) {
					break;
				}
				else if (position === formPosition) {
					rowDate = new Date(dateTime);
					const formattedDate = rowDate.toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true });

					if (formValues["selectedSlot"].includes(formattedDate)) {
						formDateTime = dateTime;
						positionUpdate.push([ position, dateTime, needed, filled + 1, remaining - 1 ]);
					}
					else {
						positionUpdate.push([ position, dateTime, needed, filled, remaining ]);
					}
				}
				else {
					positionUpdate.push([ position, dateTime, needed, filled, remaining ]);
				}
			}

			if (!formPosition || !formDateTime) {
				throw new Error(`Could not find matching event for submission: ${formValues["selectedSlot"]}`);
			}
			
			const values = [[
				(new Date()).toLocaleString(),
				formPosition,
				formDateTime,
				formValues["name"],	
				formValues["email"]
			]];

			await Sheets.spreadsheets.values.append({
				spreadsheetId: sheetId,
				range: SIGNUPS_SHEET_NAME,
				valueInputOption: "RAW",
				requestBody: {
					values: values
				}
			});

			const openNeeds = await getOpenVolumnteerNeeds(positionUpdate);
			console.log(`openNeeds: ${JSON.stringify(openNeeds)}`);
			const userConfig = await getConfigData(sheetId);
			await updateGoogleForm(userConfig["Form URL"], openNeeds);
			
			return {
				message: "Form updated successfullly."
			}
		}
		catch (error) {
			return {
				status: 571,
				error: error.message
			};
		}

	}

};