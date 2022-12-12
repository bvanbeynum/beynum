import client from "superagent";
import fs from "fs";
import path from "path";

export default {

	eventLoad: async (request, response) => {
		let clientResponse = null, 
			output = {},
			eventsSelect = null,
			eventSort = null;

		switch ((request.query.events || "").toLowerCase()) {
		case "upcoming":
			eventsSelect = "upcoming";
			eventSort = 1;
			break;
		case "past":
			eventsSelect = "past";
			eventSort = -1;
			break;
		default:
			eventsSelect = "current";
			eventSort = 1;
			break;
		}

		try {
			clientResponse = await client.get(`https://arena.flowrestling.org/events/${ eventsSelect }`);
		}
		catch(error) {
			response.statusMessage = error.response && error.response.body ? error.response.body.error : error.message;
			response.status(561).json({ location: "Get event list", error: error.response && error.response.body ? error.response.body.error : error.message });
			return;
		}
		
		let events = clientResponse.body.response.map(event => ({
				flowId: event.guid,
				name: event.name,
				location: event.locationName,
				hasBrackets: event.isPublishBrackets,
				startDate: new Date(event.startDate),
				endDate: new Date(event.endDate),
				divisionCount: event.divisions ? event.divisions.length : 0
			}))
			.sort((eventA, eventB) => eventSort === 1 ? eventA.startDate - eventB.startDate : eventB.startDate - eventA.startDate)
			.slice(0, 500);
		output.events = events;

		response.status(200).json(output);
	},

	eventDetails: async (request, response) => {
		if (!request.body.event) {
			response.statusMessage = "Missing event";
			response.status(560).json({ location: "Initialization", error: "Missing event" });
			return;
		}

		let output = {
				event: {},
				mats: [],
				teams: []
			},
			isRefresh = false,
			clientResponse = null;

		try {
			clientResponse = await client.get(`${ request.serverPath }/wrestling/data/event?flowid=${ request.body.event.flowId }`);
		}
		catch(error) {
			response.statusMessage = error.response && error.response.body ? error.response.body.error : error.message;
			response.status(561).json({ location: "Get DB event", error: error.response && error.response.body ? error.response.body.error : error.message });
			return;
		}

		let event = clientResponse.body.events.length > 0 ? clientResponse.body.events[0] : null;
		
		// Calculate if time to refresh
		if (clientResponse.body.events.length !== 1) {
			isRefresh = true;
		}
		else if (!event.lastRefresh) {
			isRefresh = true;
		}
		else if ((new Date(event.endDate)) > (new Date()) && (new Date(event.lastRefresh)) > (new Date(event.endDate))) {
			// Event is in the past and last refresh is older than end date
			isRefresh = true;
		}
		else if ((new Date()) < ((new Date(event.startDate)).getTime() - 86400000) && (new Date()) > ((new Date(event.lastRefresh)).getTime() - 3600000)){
			// Event is in the future (more than 1 day) and the last refresh is more than 1 hour old
			isRefresh = true;
		}
		else if ((new Date()) < (new Date(event.endDate)) && (new Date()) > ((new Date(event.startDate)).getTime() - 86400000) && (new Date()) > ((new Date(event.lastRefresh)).getTime() + 60000)) {
			// Event is current and last refresh is older than 1 min
			isRefresh = true;
		}

		if (isRefresh) {
			try {
				clientResponse = await client.delete(`${ request.serverPath }/wrestling/data/event?flowid=${ request.body.event.flowId }`);
			}
			catch {}

			try {
				clientResponse = await client.get(`https://arena.flowrestling.org/bracket/${ request.body.event.flowId }`);
			}
			catch(error) {
				response.statusMessage = error.response && error.response.body ? error.response.body.error : error.message;
				response.status(562).json({ location: "Get event details", error: error.response && error.response.body ? error.response.body.error : error.message });
				return;
			}

			event = {
				flowId: request.body.event.flowId,
				name: request.body.event.name,
				location: request.body.event.locationName,
				hasBrackets: request.body.event.isPublishBrackets,
				startDate: new Date(request.body.event.startDate),
				endDate: new Date(request.body.event.endDate),
				lastRefresh: new Date(),
				divisions: clientResponse.body.response.divisions.map(division => ({
					flowId: division.guid,
					name: division.name,
					sort: division.sequence,
					weightClasses: division.weightClasses.map(weight => ({
						flowId: weight.guid,
						name: weight.name,
						sort: weight.sequence,
						pools: weight.boutPools.map(pool => ({
							flowId: pool.guid,
							name: pool.name,
							sort: pool.sequence,
							matches: []
						}))
					}))
				}))
			}

			try {
				const queries = event.divisions.flatMap(division => division.weightClasses.flatMap(weight => weight.pools.flatMap(pool => ({ 
					divisionId: division.flowId,
					weightId: weight.flowId,
					poolId: pool.flowId 
				}))));

				for (let queryIndex = 0; queryIndex < queries.length; queryIndex++) {

					clientResponse = await client.get(`https://arena.flowrestling.org/bracket/${ request.body.event.flowId }/bouts/${ queries[queryIndex].weightId }/pool/${ queries[queryIndex].poolId }`);
											
					let matches = clientResponse.body.response.map(match => {
						return {
							flowId: match.guid,
							matchNumber: match.boutNumber,
							mat: match.mat ? { flowId: match.mat.guid, name: match.mat.name } : null,
							result: match.result,
							winType: match.winType,
							round: match.roundName ? match.roundName.displayName : null,
							sort: match.sequenceNumber,
							wrestler1: match.topWrestler ? {
								flowId: match.topWrestler.guid,
								firstName: match.topWrestler.firstName,
								lastName: match.topWrestler.lastName,
								teamFlowId: match.topWrestler.team.guid,
								team: match.topWrestler.team.name,
								isWinner: match.topWrestler.guid === match.winnerWrestlerGuid ? true : match.winnerWrestlerGuid === null ? null : false
							} : null,
							wrestler2: match.bottomWrestler ? {
								flowId: match.bottomWrestler.guid,
								firstName: match.bottomWrestler.firstName,
								lastName: match.bottomWrestler.lastName,
								teamFlowId: match.bottomWrestler.team.guid,
								team: match.bottomWrestler.team.name,
								isWinner: match.bottomWrestler.guid === match.winnerWrestlerGuid ? true : match.winnerWrestlerGuid === null ? null : false
							} : null
						};
					});

					event.divisions = event.divisions.map(division => {
						return division.flowId !== queries[queryIndex].divisionId ? division : {
							...division,
							weightClasses: division.weightClasses.map(weight => {
								return weight.flowId !== queries[queryIndex].weightId ? weight : {
									...weight,
									pools: weight.pools.map(pool => {
										return pool.flowId !== queries[queryIndex].poolId ? pool : {
												...pool,
												matches: matches
											};
									})
								};
							})
						};
					});
				}
			}
			catch(error) {
				response.statusMessage = error.response && error.response.body ? error.response.body.error : error.message;
				response.status(563).json({ location: "Get matches", error: error.response && error.response.body ? error.response.body.error : error.message });
				return;
			}

			try {
				clientResponse = await client.post(`${ request.serverPath }/wrestling/data/event`).send({ event: event });
			}
			catch(error) {
				response.statusMessage = error.response && error.response.body ? error.response.body.error : error.message;
				response.status(564).json({ location: "Save match", error: error.response && error.response.body ? error.response.body.error : error.message });
				return;
			}
		}
		
		let team = null,
			mat = null,
			wrestler = null;

		output.event = {
			...event,
			divisions: event.divisions.map(division => {
				division.weightClasses.forEach(weight => 
					weight.pools.forEach(pool => 
						pool.matches.forEach(match => {

							if (match.wrestler1) {
								team = output.teams.find(team => team.flowId == match.wrestler1.teamFlowId);
								if (!team) {
									output.teams.push({ flowId: match.wrestler1.teamFlowId, name: match.wrestler1.team, wrestlers: [] });
									team = output.teams.find(team => team.flowId == match.wrestler1.teamFlowId);
								}
								
								wrestler = team.wrestlers.find(wrestler => wrestler.flowId == match.wrestler1.flowId );
								if (!wrestler) {
									team.wrestlers.push({
										flowId: match.wrestler1.flowId,
										firstName: match.wrestler1.firstName,
										lastName: match.wrestler1.lastName,
										division: division.name,
										weightClass: weight.name,
										matches: match.winType && match.winType.toLowerCase() !== "bye" ? 1 : 0,
										wins: match.wrestler1.isWinner && match.winType && match.winType.toLowerCase() !== "bye" ? 1 : 0,
										losses: match.wrestler1.isWinner && match.winType && match.winType.toLowerCase() !== "bye" ? 0 : 1
									});
								}
								else {
									team.wrestlers = team.wrestlers.map(searchWrestler => ({
										...searchWrestler,
										matches: wrestler.flowId === searchWrestler.flowId && match.winType && match.winType.toLowerCase() !== "bye" ? searchWrestler.matches + 1 : searchWrestler.matches,
										wins: wrestler.flowId === searchWrestler.flowId ? (searchWrestler.wins + (match.wrestler1.isWinner && match.winType && match.winType.toLowerCase() !== "bye" ? 1 : 0)) : searchWrestler.wins,
										losses: wrestler.flowId === searchWrestler.flowId ? (searchWrestler.losses + (match.wrestler1.isWinner && match.winType && match.winType.toLowerCase() !== "bye" ? 0 : 1)) : searchWrestler.losses
									}));
								}
							}
							
							if (match.wrestler2) {
								team = output.teams.find(team => team.flowId == match.wrestler2.teamFlowId);
								if (!team) {
									output.teams.push({ flowId: match.wrestler2.teamFlowId, name: match.wrestler2.team, wrestlers: [] });
									team = output.teams.find(team => team.flowId == match.wrestler2.teamFlowId);
								}
								
								wrestler = team.wrestlers.find(wrestler => wrestler.flowId == match.wrestler2.flowId );
								if (!team.wrestlers.some(wrestler => wrestler.flowId == match.wrestler2.flowId )) {
									team.wrestlers.push({
										flowId: match.wrestler2.flowId,
										firstName: match.wrestler2.firstName,
										lastName: match.wrestler2.lastName,
										division: division.name,
										weightClass: weight.name,
										matches: match.winType && match.winType.toLowerCase() !== "bye" ? 1 : 0,
										wins: match.wrestler2.isWinner && match.winType && match.winType.toLowerCase() !== "bye" ? 1 : 0,
										losses: match.wrestler2.isWinner && match.winType && match.winType.toLowerCase() !== "bye" ? 0 : 1
									});
								}
								else {
									team.wrestlers = team.wrestlers.map(searchWrestler => ({
										...searchWrestler,
										matches: wrestler.flowId === searchWrestler.flowId && match.winType && match.winType.toLowerCase() !== "bye" ? searchWrestler.matches + 1 : searchWrestler.matches,
										wins: wrestler.flowId === searchWrestler.flowId ? (searchWrestler.wins + (match.wrestler2.isWinner && match.winType && match.winType.toLowerCase() !== "bye" ? 1 : 0)) : searchWrestler.wins,
										losses: wrestler.flowId === searchWrestler.flowId ? (searchWrestler.losses + (match.wrestler2.isWinner && match.winType && match.winType.toLowerCase() !== "bye" ? 0 : 1)) : searchWrestler.losses
									}));
								}
							}
					
							if (match.mat) {
								mat = output.mats.find(mat => mat.flowId == match.mat.flowId);
								if (!mat) {
									output.mats.push({ flowId: match.mat.flowId, name: match.mat.name, matches: [] });
									mat = output.mats.find(mat => mat.flowId == match.mat.flowId);
								}
								
								mat.matches.push({...match, division: division.name, weightClass: weight.name });
							}
						})
					)
				)

				return division;
			})
		}

		response.status(200).json(output);
	},

	uploadImage: (request, response) => {
		let tempPath = path.join(request.app.get("root"), "client/src/media/wrestling"),
			tempName = tempPath + "/" + Date.now() + ".jpg",
			imageId = null;

		const complete = () => {
			if (imageId && imageId !== "error" && fs.existsSync(tempName)) {
				fs.renameSync(tempName, tempPath + "/" + imageId + ".jpg");
				response.status(200).json({ imageId: imageId, fileName: imageId + ".jpg" });
			}
			else if (imageId === "error" && fs.existsSync(tempName)) {
				fs.unlinkSync(tempName);
			}
		};

		request.busboy.on("field", (fieldName, value) => {
			if (fieldName = "imagedata") {
				const saveImage = { ...JSON.parse(value), created: Date.now(), modified: Date.now() };

				client.post(`${ request.serverPath }/wrestling/data/image`)
					.send({ image: saveImage })
					.set("isinternal", "true")
					.then(clientResponse => {
						imageId = clientResponse.body.id;
						complete();
					})
					.catch(error => {
						imageId = "error";
						response.statusMessage = error.message;
						response.status(561).json({ error: error.message });
						complete();
					});
			}
		});

		request.busboy.on("file", (fieldName, file, upload) => {
			if (!/.jpg$/i.test(upload.filename)) {
				response.status(562).json({ error: "File is not an jpg file" });
				return;
			}
			file.pipe(fs.createWriteStream(tempName));
		});

		request.busboy.on("finish", () => {
			complete();
		});
		
		request.pipe(request.busboy);
	},

	getImage: async (request, response) => {
		let clientResponse = null;

		if (request.body.image) {
			try {
				clientResponse = await client.post(`${ request.serverPath }/wrestling/data/image`)
					.send({ image: request.body.image })
					.set("isinternal", "true")
			}
			catch(error) {
				response.statusMessage = error.response && error.response.body ? error.response.body.error : error.message;
				response.status(561).json({ location: "Save image", error: error.response && error.response.body ? error.response.body.error : error.message });
				return;
			}
		}

		try {
			clientResponse = await client.get(`${ request.serverPath }/wrestling/data/image`)
		}
		catch(error) {
			response.statusMessage = error.response && error.response.body ? error.response.body.error : error.message;
			response.status(562).json({ location: "Get images", error: error.response && error.response.body ? error.response.body.error : error.message });
			return;
		}

		const output = {},
			images = clientResponse.body.images
				.sort((imageA, imageB) => imageA.created - imageB.created)
				.map(image => ({ ...image, url: `/media/wrestling/${ image.id }.jpg`}));
		
		output.index = request.body.index !== undefined && request.body.index >= 0 && request.body.index + 1 < images.length ? request.body.index + 1 : 0;
		output.image = images[output.index];
		output.categories = [ ...new Set(images.filter(image => image.categories && image.categories.length > 0).flatMap(image => image.categories)) ];

		response.status(200).json(output);
	}

}
