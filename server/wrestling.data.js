import data from "./wrestling.schema.js";

export default {

	eventGet: (request, response) => {
		let	filter = {},
			select = {};

		if (request.query.id) {
			filter["_id"] = request.query.id;
		}
		else if (request.query.flowid) {
			filter["flowId"] = request.query.flowid;
		}
		else {
			select = { flowId: 1, name: 1, location: 1, startDate: 1, endDate: 1, isLoaded: 1, lastRefresh: 1 };
		}
		if (request.query.isloaded) {
			filter["isLoaded"] = request.query.isloaded == 1 ? true : false;
		}

		data.event.find(filter)
			.select(select)
			.lean()
			.exec()
			.then(eventsData => {
				const events = eventsData.map(({ _id, __v, ...data }) => ({ id: _id, ...data }));
				response.status(200).json({ events: events });
			})
			.catch(error => {
				response.status(560).json({ error: error.message });
			});
	},

	eventSave: (request, response) => {
		if (!request.body.event) {
			response.status(550).json({ error: "Missing object to save" });
			return;
		}
		
		const eventSave = request.body.event;

		if (eventSave.id) {
			data.event.findById(eventSave.id)
				.exec()
				.then(eventData => {
					if (!eventData) {
						throw new Error("Event not found");
					}

					Object.keys(eventSave).forEach(field => {
						if (field != "id") {
							eventData[field] = eventSave[field];
						}
					})

					return eventData.save();
				})
				.then(eventData => {
					response.status(200).json({ id: eventData._id });
				})
				.catch(error => {
					response.status(570).json({ error: error.message });
				});
		}
		else {
			new data.event({ ...eventSave })
				.save()
				.then(eventData => {
					response.status(200).json({ id: eventData._id });
				})
				.catch(error => {
					response.status(571).json({ error: error.message });
				})
		}
	},

	eventDelete: (request, response) => {
		if (!request.query.id && !request.query.flowid) {
			response.status(550).json({ error: "Missing ID to delete" });
			return;
		}

		if (request.query.flowid) {
			data.event.deleteMany({ flowId: request.query.flowid })
				.then(() => {
					response.status(200).json({ status: "ok" });
				})
				.catch(error => {
					response.status(560).json({ error: error.message });
				});
		}
		else {
			data.event.deleteOne({ _id: request.query.id })
				.then(() => {
					response.status(200).json({ status: "ok" });
				})
				.catch(error => {
					response.status(560).json({ error: error.message });
				});
		}
	},

	athleteGet: (request, response) => {
		let	filter = {},
			select = {};

		if (request.query.id) {
			filter["_id"] = request.query.id;
		}
		else {
			// select = { flowId: 1, firstName: 1, lastName: 1, team: 1 };
		}

		data.athlete.find(filter)
			.select(select)
			.lean()
			.exec()
			.then(athletesData => {
				const athletes = athletesData.map(({ _id, __v, ...data }) => ({ id: _id, ...data }));
				response.status(200).json({ athletes: athletes });
			})
			.catch(error => {
				response.status(560).json({ error: error.message });
			});
	},

	athleteSave: (request, response) => {
		if (!request.body.athlete) {
			response.status(550).json({ error: "Missing object to save" });
			return;
		}
		
		const athleteSave = request.body.athlete;

		if (athleteSave.id) {
			data.athlete.findById(athleteSave.id)
				.exec()
				.then(athleteData => {
					if (!athleteData) {
						throw new Error("Athlete not found");
					}

					Object.keys(athleteSave).forEach(field => {
						if (field != "id") {
							athleteData[field] = athleteSave[field];
						}
					})

					return athleteData.save();
				})
				.then(athleteData => {
					response.status(200).json({ id: athleteData._id });
				})
				.catch(error => {
					response.status(570).json({ error: error.message });
				});
		}
		else {
			new data.athlete({ ...athleteSave })
				.save()
				.then(athleteData => {
					response.status(200).json({ id: athleteData._id });
				})
				.catch(error => {
					response.status(571).json({ error: error.message });
				})
		}
	},

	athleteDelete: (request, response) => {
		if (!request.query.id) {
			response.status(550).json({ error: "Missing ID to delete" });
			return;
		}

		data.athlete.deleteOne({ _id: request.query.id })
			.then(() => {
				response.status(200).json({ status: "ok" });
			})
			.catch(error => {
				response.status(560).json({ error: error.message });
			});
	},

	imageGet: (request, response) => {
		let	filter = {},
			select = {};

		if (request.query.id) {
			filter["_id"] = request.query.id;
		}

		data.image.find(filter)
			.select(select)
			.lean()
			.exec()
			.then(imagesData => {
				const images = imagesData.map(({ _id, __v, ...data }) => ({ id: _id, ...data }));
				response.status(200).json({ images: images });
			})
			.catch(error => {
				response.status(560).json({ error: error.message });
			});
	},

	imageSave: (request, response) => {
		if (!request.body.image) {
			response.status(550).json({ error: "Missing object to save" });
			return;
		}
		
		const imageSave = request.body.image;

		if (imageSave.id) {
			data.image.findById(imageSave.id)
				.exec()
				.then(imageData => {
					if (!imageData) {
						throw new Error("image not found");
					}

					Object.keys(imageSave).forEach(field => {
						if (field != "id") {
							imageData[field] = imageSave[field];
						}
					})

					return imageData.save();
				})
				.then(imageData => {
					response.status(200).json({ id: imageData._id });
				})
				.catch(error => {
					response.status(570).json({ error: error.message });
				});
		}
		else {
			new data.image({ ...imageSave })
				.save()
				.then(imageData => {
					response.status(200).json({ id: imageData._id });
				})
				.catch(error => {
					response.status(571).json({ error: error.message });
				});
		}
	},

	imageDelete: (request, response) => {
		if (!request.query.id) {
			response.status(550).json({ error: "Missing ID to delete" });
			return;
		}

		data.image.deleteOne({ _id: request.query.id })
			.then(() => {
				response.status(200).json({ status: "ok" });
			})
			.catch(error => {
				response.status(560).json({ error: error.message });
			});
	},

	wrestlerGet: (request, response) => {
		let	filter = {},
			select = {};

		if (request.query.id) {
			filter["_id"] = request.query.id;
		}
		if (request.query.flowid) {
			filter["flowId"] = request.query.flowid;
		}
		if (request.query.name) {
			filter.$or = [
				{ firstName: { $regex: new RegExp(request.query.name, "i") } },
				{ lastName: { $regex: new RegExp(request.query.name, "i") } }
			];
		}
		if (request.query.team) {
			filter.team = { $regex: new RegExp(request.query.team, "i") }
		}

		data.wrestler.find(filter)
			.select(select)
			.lean()
			.exec()
			.then(wrestlersData => {
				const wrestlers = wrestlersData.map(({ _id, __v, ...data }) => ({ id: _id, ...data }));
				response.status(200).json({ wrestlers: wrestlers });
			})
			.catch(error => {
				response.status(560).json({ error: error.message });
			});
	},

	wrestlerSave: (request, response) => {
		if (!request.body.wrestler) {
			response.status(550).json({ error: "Missing object to save" });
			return;
		}
		
		const wrestlerSave = request.body.wrestler;

		if (wrestlerSave.id) {
			data.wrestler.findById(wrestlerSave.id)
				.exec()
				.then(wrestlerData => {
					if (!wrestlerData) {
						throw new Error("Wrestler not found");
					}

					Object.keys(wrestlerSave).forEach(field => {
						if (field != "id") {
							wrestlerData[field] = wrestlerSave[field];
						}
					})

					return wrestlerData.save();
				})
				.then(wrestlerData => {
					response.status(200).json({ id: wrestlerData._id });
				})
				.catch(error => {
					response.status(570).json({ error: error.message });
				});
		}
		else {
			new data.wrestler({ ...wrestlerSave })
				.save()
				.then(wrestlerData => {
					response.status(200).json({ id: wrestlerData._id });
				})
				.catch(error => {
					response.status(571).json({ error: error.message });
				});
		}
	},

	wrestlerDelete: (request, response) => {
		if (!request.query.id) {
			response.status(550).json({ error: "Missing ID to delete" });
			return;
		}

		data.wrestler.deleteOne({ _id: request.query.id })
			.then(() => {
				response.status(200).json({ status: "ok" });
			})
			.catch(error => {
				response.status(560).json({ error: error.message });
			});
	}

}