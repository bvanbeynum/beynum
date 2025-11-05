// A simple cache to avoid reading the same data multiple times in one execution.
const SCRIPT_CACHE = {};

// Sheet and Tab Names
const CONFIG_SHEET_NAME = 'Config';
const WRESTLERS_SHEET_NAME = 'Wrestlers';

/**
 * Main function to be triggered. It checks schedules and sends emails if needed.
 */
function processEmailRequests() {
	try {
		const configData = getConfiguration();
		if (!configData.emailSchedules || configData.emailSchedules.length === 0) {
			Logger.log('No email schedules found in Config sheet.');
			return;
		}

		const now = new Date();

		// Find the first unsent schedule that is past its due date
		for (const schedule of configData.emailSchedules) {
			if (schedule.sentStatus === '' && now > schedule.date) {
				Logger.log(`Processing schedule for ${schedule.date.toLocaleString()}`);

				const wrestlers = getWrestlerData();
				const wrestlersToEmail = wrestlers.filter(w => !w.fundsPaid);

				if (wrestlersToEmail.length === 0) {
					Logger.log('All wrestlers have paid. No emails to send.');
					markScheduleAsSent(schedule.row);
					return; // Exit after processing this schedule
				}

				Logger.log(`Found ${wrestlersToEmail.length} wrestlers to email.`);

				for (const wrestler of wrestlersToEmail) {
					generateAndSendEmail(wrestler, configData);
				}

				markScheduleAsSent(schedule.row);
				Logger.log('Finished processing schedule. Marked as sent.');
				break; // Process only one schedule per run
			}
		}
		Logger.log('Script finished. No pending schedules to process at this time.');

	} catch (e) {
		Logger.log(`An error occurred in the main process: ${e.toString()} \nStack: ${e.stack}`);
		// Optional: Send an email to yourself on error
		MailApp.sendEmail('wrestlingfortmill@gmail.com', 'Funds Request Emailer Error', e.toString());
	}
}

/**
 * Retrieves configuration data from the 'Config' sheet.
 * @returns {object} An object containing config values and email schedules.
 */
function getConfiguration() {
	if (SCRIPT_CACHE.config) return SCRIPT_CACHE.config;

	const ss = SpreadsheetApp.getActiveSpreadsheet();
	const configSheet = ss.getSheetByName(CONFIG_SHEET_NAME);
	
	// Read key-value config
	const configValues = configSheet.getRange('A2:B' + configSheet.getLastRow()).getValues()
		.reduce((obj, row) => {
			if (row[0]) obj[row[0]] = row[1];
			return obj;
		}, {});

	// Read email schedules
	const scheduleValues = configSheet.getRange('D2:E' + configSheet.getLastRow()).getValues();
	const emailSchedules = scheduleValues.map((row, index) => {
		if (row[0] instanceof Date) {
			return {
				date: new Date(row[0]),
				sentStatus: row[1],
				row: index + 2 // 1-based index, plus header offset
			};
		}
		return null;
	}).filter(Boolean); // Filter out empty rows

	const config = { ...configValues, emailSchedules };
	SCRIPT_CACHE.config = config; // Cache the result
	return config;
}

/**
 * Retrieves wrestler data from the 'Wrestlers' sheet.
 * @returns {Array<object>} An array of wrestler objects.
 */
function getWrestlerData() {
	if (SCRIPT_CACHE.wrestlers) return SCRIPT_CACHE.wrestlers;

	const ss = SpreadsheetApp.getActiveSpreadsheet();
	const wrestlerSheet = ss.getSheetByName(WRESTLERS_SHEET_NAME);
	const data = wrestlerSheet.getRange('A2:E' + wrestlerSheet.getLastRow()).getValues();

	const wrestlers = data.map((row, index) => ({
		name: row[0],
		parents: row[1],
		emails: row[2],
		fundsPaid: row[3] !== '',
		emailCount: parseInt(row[4], 10) || 0,
		row: index + 2 // 1-based index, plus header offset
	}));
	
	SCRIPT_CACHE.wrestlers = wrestlers; // Cache the result
	return wrestlers;
}

/**
 * Generates email content using Gemini and creates a draft.
 * @param {object} wrestler The wrestler object.
 * @param {object} config The configuration object.
 */
function generateAndSendEmail(wrestler, config) {
	try {    
		// Clean up email list
		const recipientEmails = wrestler.emails.split(',').map(email => email.trim()).join(',');

		if (!recipientEmails) {
				Logger.log(`Skipping wrestler ${wrestler.name} due to no email addresses.`);
				return;
		}

		const reminderNumber = wrestler.emailCount + 1;
		const prompt = createGeminiPrompt(wrestler, config, reminderNumber);
		const geminiResponse = callGeminiAPI(prompt);
		
		const htmlBody = marked.parse(geminiResponse);
		
		const subject = `Wrestling Feed the Team Funds`;
		
		GmailApp.createDraft(recipientEmails, subject, '', {
			htmlBody: htmlBody
		});

		Logger.log(`Created draft for ${wrestler.name} (Reminder #${reminderNumber}).`);
		incrementEmailCount(wrestler.row);

	} catch (e) {
		Logger.log(`Failed to generate or send email for ${wrestler.name}. Error: ${e.toString()}`);
	}
}

/**
 * Creates a dynamic prompt for the Gemini API.
 * @param {object} wrestler The wrestler object.
 * @param {object} config The configuration object.
 * @param {number} reminderNumber The number of this reminder (e.g., 1 for the first time).
 * @returns {string} The formatted prompt.
 */
function createGeminiPrompt(wrestler, config, reminderNumber) {
	let reminder;
	if (reminderNumber > 1) {
		reminder = `This is a friendly reminder. We still need to collect funds to have enough to feed the team for the full season.`;
	}

	// Personalizing with your saved info!
	const customInstructions = `
		You are a wrestling parent volunteer asking other wrestler parents for funds to feed the Fort Mill wrestling team. Your tone should be 
		friendly, communal, and direct, but not demanding. The goal is to 
		request money from parents to feed their wrestler, and the team for the season. Be clear about the amount and that the funds will be used to buy 
		food for the wrestlers for each event. Include the number of wrestlers, and the number of events to emphisize how 
		much is necessary. DO NOT use a subject line, just write the body of the email. Use Markdown for formatting (like 
		bolding and lists). Provide breakdown of funds per day per wrestler where it will help provide justification of funds.
	`;

	return `
		You are ${config['Parent Name']}, a helpful parent volunteer for the fort mill high school wrestling team. Your task is to request funds from other team wrestling parents to be used to feed the team at the wrestling events this season.

		${reminder}
	
		Here are your instructions:
		- Keep the tone friendly, communal, and direct, but not demanding.
		- Start with a friendly greeting to ${wrestler.parents}.
		- Be clear about the amount requested and that the funds will be used to buy food for the wrestlers for each event.
		- Clearly state the main points. Use Markdown for formatting like bullet points for lists if it makes it easier to read.
		- Conclude with exciting support for the Fort Mill wrestling team, and sign off with your name, ${config['Parent Name']}.
		- DO NOT use a subject line, just write the body of the email.
		- IMPORTANT: Do not add any information.

		---
		CONTEXT FOR THE EMAIL:
		- Parent Names: ${wrestler.parents}
		- Wrestler's Name: ${wrestler.name}
		- Total Amount Requested Per Wrestler: $${config['Amount Requested']}
		- Events: ${config['Event Days']}
		- Funds used for snacks, drinks, and dinner for overnight events
		- Payment method: ${config['Pay Information']}
		---
	`;
}


		// Here is the key information to include:
		// We are asking each family to contribute $${config['Amount Requested']} for the season.
		// This contribution is vital for us to provide meals, snacks, and drinks for the entire team at all tournaments and duals. It really helps the kids have energy for such a demanding sport.
		// You can provide the funds via ${config['Pay Information']}.
		// Thank you for your support in making this a great season for our wrestlers!


/**
 * Calls the Gemini API.
 * @param {string} prompt The text prompt to send.
 * @returns {string} The text response from the API.
 */
function callGeminiAPI(prompt) {
		const API_KEY = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
		const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${API_KEY}`;
		
		const requestBody = {
				"contents": [{
						"parts": [{
								"text": prompt
						}]
				}]
		};

		const options = {
				'method': 'post',
				'contentType': 'application/json',
				'payload': JSON.stringify(requestBody),
				'muteHttpExceptions': true
		};

		const response = UrlFetchApp.fetch(url, options);
		const responseCode = response.getResponseCode();
		const responseBody = response.getContentText();

		if (responseCode === 200) {
				const data = JSON.parse(responseBody);
				return data.candidates[0].content.parts[0].text;
		} else {
				throw new Error(`Gemini API Error: ${responseCode} - ${responseBody}`);
		}
}


/**
 * Increments the email count for a specific wrestler in the sheet.
 * @param {number} rowNum The row number of the wrestler to update.
 */
function incrementEmailCount(rowNum) {
	const wrestlerSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(WRESTLERS_SHEET_NAME);
	const countCell = wrestlerSheet.getRange(`E${rowNum}`);
	const currentCount = parseInt(countCell.getValue(), 10) || 0;
	countCell.setValue(currentCount + 1);
}

/**
 * Marks a schedule as sent by adding a timestamp.
 * @param {number} rowNum The row number of the schedule to update.
 */
function markScheduleAsSent(rowNum) {
	const configSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG_SHEET_NAME);
	configSheet.getRange(`E${rowNum}`).setValue(new Date());
}
